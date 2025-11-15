
// const dailyCleanupScheduler = require('../index');

exports.dailyCodeSchedulerStatus= (req, res) => {
  try {
    const status = global.dailyCleanupScheduler.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
};

exports.cleanUpScheduler= async (req, res) => {
  try {
    const result = await global.dailyCleanupScheduler.cleanAllExpiredCodes();
    
    res.json({
      success: result.success,
      message: result.success ? 
        `Manual cleanup completed: ${result.deletedCount} codes deleted` : 
        'Manual cleanup failed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Manual cleanup failed',
      error: error.message
    });
  }
 };



exports.stopScheduler= (req, res) => {
  try {
    global.dailyCleanupScheduler.stop();
    
    res.json({
      success: true,
      message: 'Scheduler stopped successfully',
      data: global.dailyCleanupScheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
}

exports.restartScheduler=(req, res) => {
  try {
    global.dailyCleanupScheduler.restart();
    
    res.json({
      success: true,
      message: 'Scheduler restarted successfully',
      data: global.dailyCleanupScheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to restart scheduler',
      error: error.message
    });
  }
}