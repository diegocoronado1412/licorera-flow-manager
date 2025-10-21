#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::error::Error;
use std::fs::{self, OpenOptions};
use std::path::PathBuf;
use std::process::Command;
use std::env;
use std::io::Write;
use tauri::Manager;

/// Devuelve el directorio que contiene el exe (parent)
fn exe_dir() -> Result<PathBuf, Box<dyn Error>> {
    let exe = env::current_exe()?;
    if let Some(dir) = exe.parent() {
        Ok(dir.to_path_buf())
    } else {
        Err("No se pudo determinar el directorio del ejecutable".into())
    }
}

/// Intenta localizar un archivo relativo comprobando varias ubicaciones comunes
/// rel: ejemplo "assets/licorera.db" o "backend/main.py"
fn locate_rel(rel: &str) -> Option<PathBuf> {
    // candidatas basadas en exe_dir y cwd
    if let Ok(ed) = exe_dir() {
        let cands = [
            ed.join(rel),                          // <exe_dir>/rel
            ed.join("resources").join(rel),        // <exe_dir>/resources/rel
            ed.join("..").join(rel),               // <exe_dir>/../rel
            env::current_dir().ok()?.join(rel),    // <cwd>/rel (útil en dev)
        ];
        for c in cands.iter() {
            if c.exists() {
                return Some(c.to_path_buf());
            }
        }
    } else if let Ok(cwd) = env::current_dir() {
        let p = cwd.join(rel);
        if p.exists() {
            return Some(p);
        }
    }

    // fallback dev absolute path (tu ruta de desarrollo)
    let dev_abs = PathBuf::from(r"C:\Users\coron\Desktop\LICORERA").join(rel);
    if dev_abs.exists() {
        return Some(dev_abs);
    }

    None
}

/// Copia la DB empaquetada a APPDATA y al exe_dir (si existe)
/* retorna la ruta origen usada */
fn copy_db_to_places() -> Result<PathBuf, Box<dyn Error>> {
    // posibles localizaciones del archivo licorera.db
    let rel = "assets/licorera.db";
    let res_path = locate_rel(rel).ok_or("No se encontró assets/licorera.db en las ubicaciones esperadas")?;

    // Copiar a APPDATA
    let appdata = env::var("APPDATA").map(PathBuf::from)?;
    let db_dir = appdata.join("LicoreraFlowManager");
    fs::create_dir_all(&db_dir)?;
    let app_dest = db_dir.join("licorera.db");
    if !app_dest.exists() {
        fs::copy(&res_path, &app_dest)?;
    }

    // Copiar a exe_dir
    let exe_d = exe_dir()?;
    let exe_dest = exe_d.join("licorera.db");
    if !exe_dest.exists() {
        let _ = fs::copy(&res_path, &exe_dest);
    }

    // Copiar a backend si existe
    let backend_dir = exe_d.join("backend");
    if backend_dir.exists() && backend_dir.is_dir() {
        let backend_dest = backend_dir.join("licorera.db");
        if !backend_dest.exists() {
            let _ = fs::copy(&res_path, &backend_dest);
        }
    }

    println!("DB usada: {}", res_path.display());
    println!("Copiada a APPDATA: {}", app_dest.display());
    println!("Copia en exe_dir intentada: {}", exe_dest.display());
    if backend_dir.exists() {
        println!("Copia en backend intentada: {}", backend_dir.join("licorera.db").display());
    }

    Ok(res_path)
}

/// Arranca el backend (prefiere main.exe si existe, si no main.py).
/// Redirige stdout/stderr a archivos en el exe_dir para depuración en release.
fn spawn_backend_process() -> Result<(), Box<dyn Error>> {
    let exe_d = exe_dir()?;

    // candidatas ampliadas (incluye resources/backend/dist/main.exe)
    let candidates = [
        exe_d.join("resources").join("backend").join("dist").join("main.exe"),
        exe_d.join("resources").join("backend").join("main.py"),
        exe_d.join("resources").join("backend").join("main.exe"),
        exe_d.join("backend").join("dist").join("main.exe"),
        exe_d.join("backend").join("main.exe"),
        exe_d.join("..").join("backend").join("dist").join("main.exe"),
        exe_d.join("..").join("backend").join("main.py"),
        exe_d.join("..").join("backend").join("main.exe"),
        exe_d.join("..").join("..").join("backend").join("dist").join("main.exe"),
        exe_d.join("..").join("..").join("backend").join("main.py"),
        env::current_dir()?.join("backend").join("main.py"),
        PathBuf::from(r"C:\Users\coron\Desktop\LICORERA\backend\main.py"),
    ];

    // logs en la carpeta del exe (útiles especialmente en release)
    let out_log = exe_d.join("backend-out.log");
    let err_log = exe_d.join("backend-err.log");

    // abrir/crear fichero de debug (err_log para listar intentos)
    let mut dbg_file = OpenOptions::new().create(true).append(true).open(&err_log).ok();
    if let Some(f) = dbg_file.as_mut() { let _ = writeln!(f, "=== spawn_backend_process candidates check ==="); }

    // buscar candidato existente e ir registrando
    let mut found: Option<PathBuf> = None;
    for c in candidates.iter() {
        if let Some(f) = dbg_file.as_mut() { let _ = writeln!(f, "checking: {}", c.display()); }
        if c.exists() {
            if let Some(f) = dbg_file.as_mut() { let _ = writeln!(f, "FOUND: {}", c.display()); }
            found = Some(c.to_path_buf());
            break;
        }
    }

    let script = found.ok_or("No se encontró backend (main.exe/main.py) en las candidatas")?;
    if let Some(f) = dbg_file.as_mut() { let _ = writeln!(f, "Iniciando backend desde: {}", script.display()); }

    // abrir/crear ficheros de log (append para no sobreescribir histórico)
    let stdout_file = OpenOptions::new().create(true).append(true).open(&out_log).ok();
    let stderr_file = OpenOptions::new().create(true).append(true).open(&err_log).ok();

    // preparar comando
    let mut cmd = if script.extension().and_then(|s| s.to_str()).map(|s| s.eq_ignore_ascii_case("exe")).unwrap_or(false) {
        Command::new(&script)
    } else {
        let mut c = Command::new("python");
        c.arg(&script);
        c
    };

    // determinar backend_cwd: si está en .../dist/main.exe usamos su parent().parent()
    let backend_cwd = if let Some(parent) = script.parent() {
        if parent.file_name().map(|n| n == "dist").unwrap_or(false) {
            parent.parent().map(|p| p.to_path_buf()).unwrap_or(exe_d.clone())
        } else {
            parent.to_path_buf()
        }
    } else {
        exe_d.clone()
    };

    // fijar directorio de trabajo para que el backend encuentre la DB/templates/static
    let _ = cmd.current_dir(&backend_cwd);

    if let Some(f) = stdout_file { let _ = cmd.stdout(f); }
    if let Some(f) = stderr_file { let _ = cmd.stderr(f); }

    match cmd.spawn() {
        Ok(child) => {
            if let Some(f) = dbg_file.as_mut() { let _ = writeln!(f, "Backend lanzado, pid: {}", child.id()); }
            // registra pid para depuración
            if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(exe_d.join("backend-pid.log")) {
                let _ = writeln!(f, "pid: {}, started_from: {}", child.id(), script.display());
            }
            Ok(())
        }
        Err(e) => {
            if let Some(f) = dbg_file.as_mut() { let _ = writeln!(f, "spawn error: {}", e); }
            // also write to err_log explicitly if possible
            if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&err_log) {
                let _ = writeln!(f, "spawn error: {}", e);
            }
            Err(e.into())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 1) Copiar DB
            if let Err(e) = copy_db_to_places() {
                eprintln!("Error copiando DB: {}", e);
            }

            // 2) Iniciar backend
            if let Err(e) = spawn_backend_process() {
                eprintln!("No se pudo iniciar backend: {}", e);
            }

            // 3) Ajustar ventana principal
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_title("Licorera Flow Manager");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error al iniciar la aplicación Tauri");
}
