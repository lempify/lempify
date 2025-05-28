use shared::brew;

#[allow(dead_code)]
pub trait ServiceController {
    fn name(&self) -> &'static str;

    fn install(&self) -> Result<(), String> {
        brew::install_service(&self.name())?;
        Ok(())
    }

    fn is_installed(&self) -> bool;
    fn is_running(&self) -> bool;

    fn start(&self) -> Result<(), String>;
    fn stop(&self) -> Result<(), String>;

    fn restart(&self) -> Result<(), String> {
        self.stop()?;
        self.start()
    }
}
