
class Logger {
    constructor() {
        // Associa ogni funzione a un colore
        this.subsystemColors = {
            main: "\x1b[34m",       // Blu
            model: "\x1b[36m",      // Cyan
            retriever: "\x1b[32m",  // Verde (diverso da model)
            agent: "\x1b[35m",      // Magenta
            reset: "\x1b[0m"    
        };
    }

    log(level, functionName, message) {
        const color = this.subsystemColors[functionName] || this.subsystemColors.reset;
        const formattedMessage = `[${new Date().toISOString()}] [${level}] [${functionName.toUpperCase()}] ${message}`;
        
        console.log(color + formattedMessage + this.subsystemColors.reset);
      }

    info(subsystemName, message) {
        this.log("INFO", subsystemName, message);
    }

    warn(subsystemName, message) {
        this.log("WARN", subsystemName, message);
    }

    error(subsystemName, message) {
        this.log("ERROR", subsystemName, message);
    }

    success(subsystemName, message) {
        this.log("SUCCESS", subsystemName, message);
    }

    debug(subsystemName, message) {
        this.log("DEBUG", subsystemName, message);
    }
}


const logger = new Logger();
module.exports = { logger };