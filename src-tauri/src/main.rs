#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use tauri::Manager;

fn main() {
    // 🔥 Iniciar backend en un hilo separado
    thread::spawn(|| {
        println!("⏳ Esperando backend...");
        thread::sleep(Duration::from_secs(2));

        let is_dev = cfg!(debug_assertions);

        if is_dev {
            // 🐍 MODO DESARROLLO: Python + Uvicorn
            println!("🐍 Iniciando backend en modo desarrollo");

            // 🔥 CORRECCIÓN: Subir 2 niveles para llegar a LICORERA/backend
            let backend_dir = std::env::current_dir()
                .expect("No se pudo obtener directorio actual")
                .parent()  // licorera-flow-manager/ -> LICORERA/
                .expect("No hay directorio padre")
                .parent()  // LICORERA/ -> Desktop/ (pero queremos LICORERA/)
                .expect("No hay segundo directorio padre")
                .join("LICORERA")
                .join("backend");

            // 🔥 ALTERNATIVA MÁS SIMPLE: Ruta absoluta directa
            let backend_dir = std::path::PathBuf::from(r"C:\Users\coron\Desktop\LICORERA\backend");

            println!("   Backend dir: {:?}", backend_dir);

            if !backend_dir.exists() {
                eprintln!("❌ El directorio del backend no existe: {:?}", backend_dir);
                return;
            }

            let mut cmd = Command::new("python");
            cmd.args(&[
                "-m",
                "uvicorn",
                "main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
                "--reload",
            ])
            .current_dir(&backend_dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit());

            match cmd.spawn() {
                Ok(mut child) => {
                    println!("✅ Backend Python iniciado correctamente");
                    let _ = child.wait();
                }
                Err(e) => {
                    eprintln!("❌ Error iniciando backend: {}", e);
                    eprintln!("   Asegúrate de que Python esté instalado y en el PATH");
                    eprintln!("   Y que uvicorn esté instalado: pip install uvicorn");
                }
            }
        } else {
            // 🚀 MODO PRODUCCIÓN: backend-api.exe
            println!("🚀 Iniciando backend en modo producción");

            let exe_dir = std::env::current_exe()
                .expect("No se pudo obtener ruta del exe")
                .parent()
                .expect("No hay directorio padre")
                .to_path_buf();

            let backend_exe = exe_dir.join("backend-api.exe");

            println!("   Buscando: {:?}", backend_exe);

            if !backend_exe.exists() {
                eprintln!("❌ No se encontró backend-api.exe en {:?}", exe_dir);
                return;
            }

            let mut cmd = Command::new(&backend_exe);
            cmd.current_dir(&exe_dir)
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit());

            match cmd.spawn() {
                Ok(mut child) => {
                    println!("✅ Backend ejecutable iniciado correctamente");
                    let _ = child.wait();
                }
                Err(e) => {
                    eprintln!("❌ Error iniciando backend-api.exe: {}", e);
                }
            }
        }
    });

    // 🔥 Iniciar Tauri después de un pequeño delay
    println!("🚀 Iniciando interfaz Tauri...");
    thread::sleep(Duration::from_millis(500));

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