mod ipc;
use ipc::server::start_ipc_server;

fn main() {
    println!("🚀 lempifyd booting up...");
    let socket_path = "/tmp/lempifyd.sock";
    start_ipc_server(socket_path).expect("IPC server failed");
}