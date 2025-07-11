import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.NODEMAILER_USER, process.env.NODEMAILER_PASS);

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});

function generateBill(billData) {
    const { customerName, storeName, items, totalAmount, date } = billData;

    // Create a simple HTML structure for the bill
    let billHtml = `
        <html>
        <head>
            <style>
            body { font-family: Arial, sans-serif; }
            .bill-header { text-align: center; }
            .bill-items { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .bill-items th, .bill-items td { border: 1px solid #ddd; padding: 8px; }
            .bill-items th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="bill-header">
            <h1>Bill Receipt</h1>
            <h2>Store Name: ${storeName}</h2>
            <p>Date: ${date}</p>
            <p>Customer Name: ${customerName}</p>
            </div>
            <table class="bill-items">
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
            </tr>`;
    
    items.forEach(item => {
        billHtml += `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price}</td>
        </tr>`;
    });
    
    billHtml += `
            </table>
            <h2>Total Amount: $${totalAmount}</h2>
        </body>
        </html>`;
    
    return billHtml;
}


export async function sendBillEmail(email, billData) {
    const billHtml = generateBill(billData);
    console.log(email);
    const mailOptions = {
        from: 'omari73@ethereal.email',
        to: email,
        subject: "Bill Receipt",
        text: "Thank you for your purchase!",
        html: billHtml
    };

    try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    } catch (error) {
    console.log("Error sending email:", error);
    }
}


export async function sendPaymentLink(email, paymentUrl) {
    console.log("Sending payment link to:", email);
    const mailOptions = {
        from: '"StockIt" <your@email.com>',
        to: email,
        subject: "Complete Your Payment",
        html: `
          <h2>Complete your purchase</h2>
          <p>Click the link below to complete your payment:</p>
          <a href="${paymentUrl}">${paymentUrl}</a>
        `,
      };
    try{
        const info = await transporter.sendMail(mailOptions);
        console.log("Payment link sent:", info.response);

    }
    catch (error) {
        console.error("Error sending payment link:", error);
    }
}

export async function sendPasswordResetEmail(email, resetLink) {
    const mailOptions = {
        from: 'no-reply@stockit.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password. If you did not request this, please ignore this email.</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link will expire in 1 hour.</p>
        `,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.response);
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
}