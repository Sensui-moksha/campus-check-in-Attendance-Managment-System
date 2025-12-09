/**
 * Scheduled Promotion Job Initializer
 * 
 * Sets up scheduled tasks to automatically promote students
 * when semesters end. Can use different scheduling libraries
 * (node-cron, agenda, bull, etc.)
 * 
 * Current implementation uses node-cron (lightweight, synchronous)
 */

let cronJob = null;

/**
 * Initialize scheduled promotion job
 * Runs daily at 2:00 AM to check for ended semesters
 */
const initializePromotionScheduler = async () => {
  try {
    // Check if node-cron is available
    let cron;
    try {
      cron = require('node-cron');
    } catch (err) {
      console.warn('⚠️ node-cron not installed. Install with: npm install node-cron');
      return null;
    }

    const { processEndedSemesters } = require('./autoPromotion');

    // Schedule job to run daily at 2:00 AM
    cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('🔔 Running scheduled promotion check...');
      try {
        const result = await processEndedSemesters('SYSTEM_AUTO');
        if (result.processed > 0) {
          console.log(`✅ Auto-promotion completed: ${result.processed} semester(s) processed`);
        } else {
          console.log('✅ No ended semesters to process');
        }
      } catch (error) {
        console.error('❌ Error in scheduled promotion job:', error.message);
      }
    });

    console.log('✅ Promotion scheduler initialized (runs daily at 2:00 AM)');
    return cronJob;

  } catch (error) {
    console.error('❌ Failed to initialize promotion scheduler:', error.message);
    return null;
  }
};

/**
 * Stop the scheduled promotion job
 */
const stopPromotionScheduler = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('⏹️ Promotion scheduler stopped');
    cronJob = null;
  }
};

/**
 * Get scheduler status
 */
const getSchedulerStatus = () => {
  return {
    isRunning: cronJob ? cronJob.status === 'started' : false,
    nextRun: cronJob ? 'Daily at 2:00 AM' : 'Not initialized',
    description: 'Automatic promotion on semester end'
  };
};

module.exports = {
  initializePromotionScheduler,
  stopPromotionScheduler,
  getSchedulerStatus
};
