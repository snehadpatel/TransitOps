const cron = require('node-cron');
const nodemailer = require('nodemailer');
const prisma = require('../utils/prismaClient');

// Scheduled to run daily at 8:00 AM
function startCronJobs() {
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily license expiry check...');
    try {
      // Find drivers whose licenses expire in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const now = new Date();

      const expiringDrivers = await prisma.driver.findMany({
        where: {
          license_expiry: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          status: {
            not: 'SUSPENDED'
          }
        }
      });

      if (expiringDrivers.length > 0) {
        console.log(`⚠️ Found ${expiringDrivers.length} drivers with expiring licenses. Sending email.`);
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
          port: process.env.SMTP_PORT || 2525,
          auth: {
            user: process.env.SMTP_USER || 'user',
            pass: process.env.SMTP_PASS || 'pass',
          }
        });

        const listHtml = expiringDrivers.map(d => `<li><b>${d.name}</b> - License: ${d.license_number} - Expires on: ${d.license_expiry.toDateString()}</li>`).join('');

        await transporter.sendMail({
          from: '"TransitOps System" <no-reply@transitops.com>',
          to: process.env.SAFETY_OFFICER_EMAIL || 'safety@transitops.com',
          subject: 'Action Required: Upcoming Driver License Expirations',
          html: `<p>Hello Safety Officer,</p>
                 <p>The following drivers have licenses expiring within the next 30 days:</p>
                 <ul>${listHtml}</ul>
                 <p>Please ensure they are renewed promptly to avoid suspension.</p>
                 <br/><p>- TransitOps Automated System</p>`
        });
      } else {
        console.log('✅ No licenses expiring within 30 days.');
      }
    } catch (err) {
      console.error('❌ Error in licenseCron job:', err);
    }
  });
}

module.exports = { startCronJobs };
