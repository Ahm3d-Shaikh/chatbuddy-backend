export function Email_Lead_joined(lead: any, chatbot_id: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lead Limit Reached</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #0056b3; margin-bottom: 20px;">Lead Has Reached the Limit</h2>
        <p style="margin-bottom: 15px;">Hello there,</p>
        <p style="margin-bottom: 15px;">A new lead has joined your chatbot and has reached the set limit.</p>
        <div style="background-color: #ffffff; border-left: 4px solid #0056b3; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #0056b3; margin-top: 0;">Lead Details:</h3>
            <p style="margin-bottom: 5px;"><strong>Name</strong> ${lead?.data?.name}</p>
            <p style="margin-bottom: 5px;"><strong>Email:</strong> ${lead?.data?.email}</p>
            <p style="margin-bottom: 5px;"><strong>Phone:</strong> ${lead?.data?.phone}</p>
            <p style="margin-bottom: 5px;"><strong>Last Message At :</strong> ${lead?.data?.last_message_at}</p>
        </div>
        <p style="margin-bottom: 15px;">Please take appropriate action or <a href="https://app.chatbuddy.io/dashboard/chat-home?chatbot_id=${chatbot_id}">adjust</a> your chatbot settings if necessary.</p>
        <p style="margin-bottom: 5px;">Regards,</p>
        <p style="margin-bottom: 0;"><strong>Chatbuddy.io Team</strong></p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <p>© 2024 Chatbuddy.io. All rights reserved.</p>
    </div>
</body>
</html>`;
}

export function Email_NEW_Lead_joined(lead: any) {
  const phone = lead?.data?.phone || 'N/A';
  const email = lead?.data?.email || 'N/A';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Lead Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #0056b3; margin-bottom: 20px;">New Lead Notification</h2>
        <p style="margin-bottom: 15px;">Hello there,</p>
        <p style="margin-bottom: 15px;">A new lead has joined your chatbot.</p>
        <div style="background-color: #ffffff; border-left: 4px solid #0056b3; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #0056b3; margin-top: 0;">Lead Details:</h3>
            <p style="margin-bottom: 5px;"><strong>Phone:</strong> ${phone}</p>
            <p style="margin-bottom: 5px;"><strong>Email:</strong> ${email}</p>
        </div>
        <p style="margin-bottom: 15px;">Regards,</p>
        <p style="margin-bottom: 0;"><strong>Chatbuddy.io</strong></p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <p>© 2024 Chatbuddy.io. All rights reserved.</p>
    </div>
</body>
</html>`;
}

export function Email_Lead_message() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Message Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #0056b3; margin-bottom: 20px;">New Message Notification</h2>
        <p style="margin-bottom: 15px;">Hello there,</p>
        <p style="margin-bottom: 15px;">A new message has been sent to your chatbot!</p>
        <p style="margin-bottom: 15px;">Regards,</p>
        <p style="margin-bottom: 0;"><strong>Chatbuddy.io</strong></p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <p>© 2024 Chatbuddy.io. All rights reserved.</p>
    </div>
</body>
</html>`;
}
