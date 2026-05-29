import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_ADDRESS='testsam360@gmail.com'
EMAIL_PASSWORD='rddwmbynfcbgpywf'

def create_email_template(filename, rsa_key, encryption_date, image_details):

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body>
        <p><strong>📄 Original Filename:</strong> {filename}</p>
        <p><strong>📅 Encryption Date:</strong> {encryption_date}</p>
        <p><strong>📝 Image Details:</strong> {image_details if image_details else 'No description provided'}</p>
                
        <h3 style="color: #0f3460; margin-top: 30px;">Your RSA Decryption Key:</h3>
        <div>
            {rsa_key}
        </div>
    </body>
    </html>
    """
    return html_content


def send_encryption_email(recipient_email, filename, rsa_key, encryption_date, image_details):
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Encryption Key for {filename}'
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = recipient_email
        
        # Create plain text version
        text_content = f"""
        Your image has been successfully encrypted.
        
        Original Filename: {filename}
        Encryption Date: {encryption_date}
        Image Details: {image_details if image_details else 'No description provided'}
        
        Your RSA Decryption Key: {rsa_key}
        """
        
        # Create HTML version
        html_content = create_email_template(filename, rsa_key, encryption_date, image_details)
        
        # Attach both versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        
        print(f" Encryption key sent to {recipient_email}")
        return True
    
    except Exception as e:
        print(f" Failed to send email: {str(e)}")
        print(f" Email would have been sent to: {recipient_email}")
        print(f" RSA Key: {rsa_key}")
        # In development, we don't fail the encryption if email fails
        return False

