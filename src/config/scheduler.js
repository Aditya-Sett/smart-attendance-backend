// config/scheduler.js
module.exports = {
  // Cron schedule for daily cleanup (2:00 AM by default)
  DAILY_CLEANUP_SCHEDULE: process.env.DAILY_CLEANUP_SCHEDULE || '0 2 * * *',
  
  // Run cleanup on server start
  RUN_ON_STARTUP: process.env.RUN_ON_STARTUP !== 'false',
  
  // Enable/disable scheduler
  SCHEDULER_ENABLED: process.env.SCHEDULER_ENABLED !== 'false'
};