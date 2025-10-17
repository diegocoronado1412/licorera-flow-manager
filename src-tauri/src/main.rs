#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::env;
use tauri::Manager;

/// Copia la DB empaquetada a APPDATA y al exe_dir
fn copy_db_to_places() -> Result<PathBuf, Box<dyn Error>> {
    // Intentar localizar la DB en assets
    let res_path = if let Ok(mut exe) = env::current_exe() {
        exe.pop();
        let candidate = exe.join("assets").join("licorera.db");
        if candidate.exists() {
            candidate
        } else {
            let dev_candidate = env::current_dir()?.join("src-tauri").join("assets").join("licorera.db");
            if dev_candidate.exists() {
                dev_candidate
            } else {
                return Err("No se encontró assets/licorera.db".into());
            }
        }
    } else {
        return Err("No se pudo resolver la ruta del ejecutable".into());
    };

    // Copiar a APPDATA
    let appdata = env::var("APPDATA").map(PathBuf::from)?;
    let db_dir = appdata.join("LicoreraFlowManager");
    fs::create_dir_all(&db_dir)?;
    let app_dest = db_dir.join("licorera.db");
    if !app_dest.exists() {
        fs::copy(&res_path, &app_dest)?;
    }

    // Copiar a backend y exe_dir
    let mut exe_dir = env::current_exe()?;
    exe_dir.pop();

    let backend_dir = exe_dir.join("backend");
    if backend_dir.exists() && backend_dir.is_dir() {
        let backend_dest = backend_dir.join("licorera.db");
        if !backend_dest.exists() {
            let _ = fs::copy(&res_path, &backend_dest);
        }
    }

    let exe_dest = exe_dir.join("licorera.db");
    if !exe_dest.exists() {
        let _ = fs::copy(&res_path, &exe_dest);
    }

    println!("DB usada: {}", res_path.display());
    println!("Copiada a APPDATA: {}", app_dest.display());
    println!("Copia en exe_dir intentada: {}", exe_dest.display());
    if backend_dir.exists() {
        println!("Copia en backend intentada: {}", backend_dir.join("licorera.db").display());
    }

    Ok(res_path)
}

/// Arranca el backend Python
fn spawn_backend_process() -> Result<(), Box<dyn Error>> {
    // Rutas posibles al backend
    let script_candidates = vec![
        env::current_exe()?.parent().unwrap().join("backend").join("main.py"),
        env::current_exe()?.parent().unwrap().join("..").join("backend").join("main.py"),
        env::current_dir()?.join("..").join("backend").join("main.py"),
        env::current_dir()?.join("backend").join("main.py"),
        PathBuf::from(r"C:\Users\coron\Desktop\LICORERA\backend\main.py"), // ruta absoluta dev
    ];

    let script = script_candidates.into_iter()
        .find(|p| p.exists())
        .ok_or("No se encontró backend/main.py")?;

    println!("Iniciando backend desde: {}", script.display());

    Command::new("python")
        .arg(script)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;

    println!("Backend Python lanzado correctamente.");
    Ok(())
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
