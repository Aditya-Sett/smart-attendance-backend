const cron = require('node-cron');
const AttendanceCode=require('../models/AttendanceCode_Model');
const config = require('../config/scheduler');

class DailyCodeCleanupScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.schedule = config.DAILY_CLEANUP_SCHEDULE;
    this.cron=null;
  }

  start() {
    if (!config.SCHEDULER_ENABLED) {
      console.log('Daily code cleanup scheduler is disabled via configuration');
      return;
    }

    if(this.isRunning){
      console.log('Daily code cleanup scheduler is already RUNNING');
    }

    // Schedule daily cleanup
    this.cron=cron.schedule(this.schedule, async () => {
      console.log(`[${new Date().toISOString()}] Automated daily code cleanup triggered`);
      await this.cleanAllExpiredCodes();
    });

    if(!this.isRunning){
      console.log(`Daily code cleanup scheduler started - schedule: ${this.schedule}`);
      this.isRunning = true;
    }

    // // Run on startup if configured
    // if (config.RUN_ON_STARTUP) {
    //   console.log('Running initial cleanup on startup...');
    //   setTimeout(() => {
    //     this.cleanAllExpiredCodes();
    //   }, 5000); // Wait 5 seconds after server start
    // }
  }

  async cleanAllExpiredCodes() {
    try {
      const currentDateTime = new Date();
      
      // Find expired codes first (for logging)
      const expiredCodes = await AttendanceCode.find({
        expiresAt: { $lt: currentDateTime }
      });

      // Delete all expired codes
      const result = await AttendanceCode.deleteMany({
        expiresAt: { $lt: currentDateTime }
      });

      this.lastRun = new Date();
      
      // Log details
      console.log(`[${this.lastRun.toISOString()}] Daily cleanup report:`);
      console.log(`- Found ${expiredCodes.length} expired codes`);
      console.log(`- Successfully deleted ${result.deletedCount} codes`);
      
      // if (expiredCodes.length > 0) {
      //   console.log(`- Sample expired codes:`, expiredCodes.slice(0, 3).map(AttendanceCode => ({
      //     id: AttendanceCode._id,
      //     teacherId: AttendanceCode.teacherId,
      //     expiresAt: AttendanceCode.expiresAt
      //   })));
      // }

      return {
        success: true,
        deletedCount: result.deletedCount,
        totalFound: expiredCodes.length,
        timestamp: this.lastRun
      };

    } catch (error) {
      console.error('Error in daily code cleanup:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  stop() {
    if(this.isRunning){
      this.cron.stop();

      this.isRunning = false;
    }
    
    console.log('Daily code cleanup scheduler stopped');
  }

  restart(){
    this.stop();
    this.start();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      schedule: this.schedule,
      description: 'Automated daily cleanup of all expired codes'
    };
  }

  // getNextRunTime() {
  //   const cronParser = require('cron-parser');
  //   try {
  //     const interval = cronParser.parseExpression(this.schedule);
  //     return interval.next().toDate();
  //   } catch (error) {
  //     return 'Unable to calculate next run time';
  //   }
  // }

  getNextRunTime() {
  if (!this.isRunning) {
    return 'Scheduler is stopped';
  }
  
  const now = new Date();
  const nextRun = new Date(now);
  
  // Handle your schedule "59 * * * *" (runs at 59 minutes of every hour)
  if (this.schedule === '59 * * * *') {
    nextRun.setMinutes(59, 0, 0);
    if (now >= nextRun) {
      nextRun.setHours(nextRun.getHours() + 1);
    }
  } 
  // Handle daily schedule "0 2 * * *" (runs at 2:00 AM daily)
  else if (this.schedule === '0 2 * * *') {
    nextRun.setHours(2, 0, 0, 0);
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }
  // Add more schedule patterns as needed
  else {
    return 'Schedule pattern not supported';
  }
  
  return nextRun;
}
}

module.exports = DailyCodeCleanupScheduler;