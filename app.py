from flask import Flask, render_template, request, redirect, url_for, session, flash, send_file, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime, date, time
from encrypt import encrypt_image
from decrypt import decrypt_image
from email_service import send_encryption_email
from database import get_db, init_database

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your-secret-key-change-this-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 500MB limit
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'bmp', 'gif'}

os.makedirs('uploads/original', exist_ok=True)
os.makedirs('uploads/encrypted', exist_ok=True)
os.makedirs('uploads/decrypted', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

init_database()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not all([name, email, password, confirm_password]):
            flash('All fields are required', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')
        
        with get_db() as db:
            existing_user = db.fetch_one("SELECT id FROM users WHERE email = %s", (email,))
            
            if existing_user:
                flash('Email already registered', 'error')
                return render_template('register.html')
            
            # Insert new user with plain text password
            query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
            user_id = db.execute_query(query, (name, email, password))
            
            if user_id:
                flash('Registration successful! Please login.', 'success')
                return redirect(url_for('login'))
            else:
                flash('Registration failed. Please try again.', 'error')
    
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        with get_db() as db:
            user = db.fetch_one("SELECT * FROM users WHERE email = %s", (email,))
            
            if user and user['password'] == password:
                with get_db() as db:
                    db.execute_query(
                        "UPDATE users SET updated_at = NOW() WHERE id = %s",
                        (user['id'],)
                    )
                session['user_id'] = user['id']
                session['user_email'] = user['email']
                session['user_name'] = user['name']
                flash(f'Welcome back, {user["name"]}!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password', 'error')
    
    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please login to access dashboard', 'warning')
        return redirect(url_for('login'))
    
    with get_db() as db:
        # Get user's encryption history
        query = """
        SELECT id, original_filename, encryption_date, image_details, encrypted_filename
        FROM encryption_history 
        WHERE user_id = %s 
        ORDER BY encryption_date DESC, encryption_time DESC
        LIMIT 50
        """
        history = db.fetch_all(query, (session['user_id'],))
    
    return render_template('dashboard.html', history=history or [])


@app.route('/encrypt', methods=['GET', 'POST'])
def encrypt():
    if 'user_id' not in session:
        flash('Please login to encrypt images', 'warning')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['image']
        image_details = request.form.get('details', '')
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Secure filename and save original
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            original_filename = f"{timestamp}_{filename}"
            original_path = os.path.join(app.config['UPLOAD_FOLDER'], 'original', original_filename)
            file.save(original_path)
            
            try:
                # Encrypt the image
                encrypted_filename = f"encrypted_{timestamp}.dat"
                encrypted_path = os.path.join(app.config['UPLOAD_FOLDER'], 'encrypted', encrypted_filename)
                rsa_key = encrypt_image(original_path, encrypted_path)
                
                # Save to database
                with get_db() as db:
                    query = """
                    INSERT INTO encryption_history 
                    (user_id, original_filename, encrypted_filename, encryption_date, 
                     encryption_time, image_details, rsa_key, encrypted_file_path)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    now = datetime.now()
                    db.execute_query(query, (
                        session['user_id'],
                        filename,
                        encrypted_filename,
                        now.date(),
                        now.time(),
                        image_details,
                        rsa_key,
                        encrypted_path
                    ))
                
                with get_db() as db:
                    db.execute_query(
                        "UPDATE users SET updated_at = NOW() WHERE id = %s",
                        (session['user_id'],)
                    )

                # Send email with key
                send_encryption_email(
                    session['user_email'],
                    filename,
                    rsa_key,
                    now.strftime('%Y-%m-%d'),
                    image_details
                )
                
                # Return success response
                return jsonify({
                    'success': True,
                    'encrypted_filename': encrypted_filename,
                    'original_filename': filename,
                    'date': now.strftime('%Y-%m-%d'),
                    'time': now.strftime('%H:%M:%S'),
                    'rsa_key': rsa_key,
                    'download_url': url_for('download_encrypted', filename=encrypted_filename)
                })
            
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 500
        else:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
    
    return render_template('encrypt.html')


@app.route('/decrypt', methods=['GET', 'POST'])
def decrypt():
    if 'user_id' not in session:
        flash('Please login to decrypt images', 'warning')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        if 'encrypted_file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['encrypted_file']
        rsa_key_input = request.form.get('rsa_key', '').strip()
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not rsa_key_input:
            return jsonify({'success': False, 'error': 'Please enter RSA key'}), 400
        
        # Save uploaded encrypted file temporarily
        encrypted_filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_encrypted_path = os.path.join(app.config['UPLOAD_FOLDER'], 'encrypted', f"temp_{timestamp}_{encrypted_filename}")
        file.save(temp_encrypted_path)
        
        try:
            # Prepare decrypted file path
            decrypted_filename = f"decrypted_{timestamp}.png"
            decrypted_path = os.path.join(app.config['UPLOAD_FOLDER'], 'decrypted', decrypted_filename)
            
            # Decrypt the image
            rsa_key_normalized = rsa_key_input.replace('-', '').upper()
            original_name = decrypt_image(temp_encrypted_path, decrypted_path, rsa_key_normalized)
            
            # Log decryption attempt
            with get_db() as db:
                query = """
                INSERT INTO decryption_logs 
                (user_id, decryption_date, decryption_time, success)
                VALUES (%s, %s, %s, %s)
                """
                now = datetime.now()
                db.execute_query(query, (
                    session['user_id'],
                    now.date(),
                    now.time(),
                    True
                ))
            
            # Return success response
            return jsonify({
                'success': True,
                'original_filename': original_name,
                'decrypted_filename': decrypted_filename,
                'download_url': url_for('download_decrypted', filename=decrypted_filename)
            })
        
        except ValueError as e:
            # Log failed decryption
            with get_db() as db:
                query = """
                INSERT INTO decryption_logs 
                (user_id, decryption_date, decryption_time, success, error_message)
                VALUES (%s, %s, %s, %s, %s)
                """
                now = datetime.now()
                db.execute_query(query, (
                    session['user_id'],
                    now.date(),
                    now.time(),
                    False,
                    str(e)
                ))
            
            return jsonify({'success': False, 'error': str(e)}), 400
        except Exception as e:
            return jsonify({'success': False, 'error': f'Decryption failed: {str(e)}'}), 500
        finally:
            if os.path.exists(temp_encrypted_path):
                os.remove(temp_encrypted_path)
    
    return render_template('decrypt.html')


@app.route('/download/encrypted/<filename>')
def download_encrypted(filename):
    if 'user_id' not in session:
        flash('Please login to download files', 'warning')
        return redirect(url_for('login'))
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'encrypted', filename)
    
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=filename)
    else:
        flash('File not found', 'error')
        return redirect(url_for('dashboard'))


@app.route('/download/decrypted/<filename>')
def download_decrypted(filename):
    if 'user_id' not in session:
        flash('Please login to download files', 'warning')
        return redirect(url_for('login'))
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'decrypted', filename)
    
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=filename)
    else:
        flash('File not found', 'error')
        return redirect(url_for('decrypt'))


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)