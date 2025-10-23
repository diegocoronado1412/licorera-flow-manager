#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::error::Error;
use std::fs::{self, OpenOptions};
use std::path::PathBuf;
use std::env;
use std::io::Write;
use tauri::Manager;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

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
/// rel: ejemplo "assets/licorera.db" o "backend-api.exe"
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

    println!("DB usada: {}", res_path.display());
    println!("Copiada a APPDATA: {}", app_dest.display());
    println!("Copia en exe_dir intentada: {}", exe_dest.display());

    Ok(res_path)
}

/// Arranca el backend (busca backend-api.exe empaquetado)
fn spawn_backend_process() -> Result<(), Box<dyn Error>> {
    let exe_d = exe_dir()?;

    // Candidatas para encontrar backend-api.exe
    let candidates = [
        exe_d.join("backend-api.exe"),                              // junto al exe principal
        exe_d.join("resources").join("backend-api.exe"),            // en resources/
        exe_d.join("..").join("backend-api.exe"),                   // un nivel arriba
        env::current_dir()?.join("backend-api.exe"),                // en cwd
        PathBuf::from(r"C:\Users\coron\Desktop\LICORERA\licorera-flow-manager\src-tauri\backend-api.exe"), // dev
    ];

    // logs en la carpeta del exe
    let out_log = exe_d.join("backend-out.log");
    let err_log = exe_d.join("backend-err.log");

    // abrir/crear fichero de debug
    let mut dbg_file = OpenOptions::new().create(true).append(true).open(&err_log).ok();
    if let Some(f) = dbg_file.as_mut() { 
        let _ = writeln!(f, "\n=== spawn_backend_process ===");
    }

    // buscar candidato existente
    let mut found: Option<PathBuf> = None;
    for c in candidates.iter() {
        if let Some(f) = dbg_file.as_mut() { 
            let _ = writeln!(f, "checking: {}", c.display());
        }
        if c.exists() {
            if let Some(f) = dbg_file.as_mut() { 
                let _ = writeln!(f, "FOUND: {}", c.display());
            }
            found = Some(c.to_path_buf());
            break;
        }
    }

    let backend_exe = found.ok_or("No se encontró backend-api.exe en las candidatas")?;
    
    if let Some(f) = dbg_file.as_mut() { 
        let _ = writeln!(f, "Iniciando backend desde: {}", backend_exe.display());
    }

    // abrir/crear ficheros de log
    let stdout_file = OpenOptions::new().create(true).append(true).open(&out_log).ok();
    let stderr_file = OpenOptions::new().create(true).append(true).open(&err_log).ok();

    // preparar comando
    let mut cmd = Command::new(&backend_exe);
    
    // fijar directorio de trabajo para que el backend encuentre la DB
    let _ = cmd.current_dir(&exe_d);

    if let Some(f) = stdout_file { 
        let _ = cmd.stdout(f);
    }
    if let Some(f) = stderr_file { 
        let _ = cmd.stderr(f);
    }

    match cmd.spawn() {
        Ok(child) => {
            if let Some(f) = dbg_file.as_mut() { 
                let _ = writeln!(f, "Backend lanzado, pid: {}", child.id());
            }
            
            // registra pid para depuración
            if let Ok(mut f) = OpenOptions::new()
                .create(true)
                .append(true)
                .open(exe_d.join("backend-pid.log")) 
            {
                let _ = writeln!(f, "pid: {}, started_from: {}", child.id(), backend_exe.display());
            }
            
            Ok(())
        }
        Err(e) => {
            if let Some(f) = dbg_file.as_mut() { 
                let _ = writeln!(f, "spawn error: {}", e);
            }
            Err(e.into())
        }
    }
}
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Iniciar el backend de Python en un hilo separado
    thread::spawn(|| {
        #[cfg(target_os = "windows")]
        {
            // Buscar el ejecutable del backend
            let backend_exe = if cfg!(debug_assertions) {
                // En desarrollo, usar Python directamente
                let python_path = std::env::current_dir()
                    .unwrap()
                    .parent()
                    .unwrap()
                    .join("backend")
                    .join(".venv")
                    .join("Scripts")
                    .join("python.exe");
                
                let main_py = std::env::current_dir()
                    .unwrap()
                    .parent()
                    .unwrap()
                    .join("backend")
                    .join("main.py");

                println!("🐍 Iniciando backend en modo desarrollo");
                println!("   Python: {:?}", python_path);
                println!("   Script: {:?}", main_py);

                Command::new(python_path)
                    .arg(main_py)
                    .current_dir(std::env::current_dir().unwrap().parent().unwrap().join("backend"))
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
                    .expect("❌ No se pudo iniciar el backend de Python")
            } else {
                // En producción, buscar el ejecutable empaquetado
                let exe_path = std::env::current_exe()
                    .unwrap()
                    .parent()
                    .unwrap()
                    .join("backend-api.exe");

                println!("🚀 Iniciando backend en modo producción");
                println!("   Ejecutable: {:?}", exe_path);

                Command::new(exe_path)
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
                    .expect("❌ No se pudo iniciar el backend-api.exe")
            };

            println!("✅ Backend iniciado correctamente");
        }

        #[cfg(not(target_os = "windows"))]
        {
            println!("⚠️  Plataforma no soportada para auto-inicio del backend");
        }
    });

    // Esperar a que el backend se inicie
    println!("⏳ Esperando a que el backend esté listo...");
    thread::sleep(Duration::from_secs(3));

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}