# BMT Mobile — Tauri + React

## Varför Tauri?
- ✅ Rust backend (fungerar i Termux!)
- ✅ Native performance
- ✅ Mindre än Electron
- ✅ iOS + Android

## Arkitektur
```
bmt-mobile/
├── src/          # React frontend (dela med bmt-client)
├── src-tauri/    # Rust backend
│   ├── main.rs   # Commands: save_task, load_tasks, etc.
│   └── lib.rs    # SQLite integration
└── Cargo.toml
```

## Setup i Termux
```bash
# Installera Tauri CLI
cargo install tauri-cli

# Skapa projekt
npm create tauri-app@latest bmt-mobile
# Välj: React + TypeScript + Rust

# Bygga
cd bmt-mobile
cargo tauri build
```

## Rust Commands (exempel)
```rust
#[tauri::command]
fn save_tasks(tasks: Vec<Task>) -> Result<(), String> {
    // Spara till SQLite
    Ok(())
}

#[tauri::command]
fn load_tasks() -> Result<Vec<Task>, String> {
    // Ladda från SQLite
    Ok(tasks)
}
```

## Kör lokalt
```bash
cargo tauri dev
```