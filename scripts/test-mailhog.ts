import * as nodemailer from 'nodemailer';

async function testNodemailer() {
  console.log('Testing Nodemailer with MailHog...\n');

  const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'localhost',
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 1025,
    secure: false,
  });

  try {
    console.log('1. Verifying connection...');
    await transport.verify();
    console.log('   ✓ Connected to MailHog\n');

    console.log('2. Sending test email...');
    const info = await transport.sendMail({
      from: 'test@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Email from Nodemailer',
      text: 'This is a test email sent via Nodemailer using async/await',
    });
    console.log(`   ✓ Message sent: ${info.messageId}`);
    console.log(`   ✓ Envelope:`, info.envelope, '\n');

    console.log('3. Verifying via MailHog API...');
    const response = await fetch('http://localhost:8025/api/v2/messages');
    const data = await response.json();
    console.log(`   ✓ Found ${data.total} message(s)\n`);

    if (data.items && data.items.length > 0) {
      const latestEmail = data.items[data.items.length - 1];
      const headers = latestEmail.Content.Headers;
      console.log('4. Email content verified:');
      console.log(`   From: ${headers.From}`);
      console.log(`   To: ${headers.To}`);
      console.log(`   Subject: ${headers.Subject}`);
      console.log(`   Body: ${latestEmail.Content.Body}`);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNodemailer();
