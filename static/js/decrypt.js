// decrypt.js - Decryption page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.querySelector('.dropzone');
    const rsaKeyInput = document.getElementById('rsaKey');
    const decryptButton = document.querySelector('.btn-action');
    const rightPanel = document.getElementById('rightPanel');
    const loading = document.getElementById('loading');
    const resultView = document.getElementById('resultView');
    
    let selectedFile = null;

    // Dropzone click handler
    if (dropzone) {
        dropzone.addEventListener('click', function() {
            fileInput.click();
        });

        // Drag and drop functionality
        dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--accent)';
            this.style.backgroundColor = 'rgba(78, 204, 163, 0.05)';
        });

        dropzone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            this.style.backgroundColor = '';
        });

        dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            this.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleFileSelect(this.files[0]);
            }
        });
    }

    // Handle file selection
    function handleFileSelect(file) {
        // Validate file extension (.dat)
        if (!file.name.endsWith('.dat')) {
            showNotification('Invalid file. Please select an encrypted .dat file.', 'error');
            return;
        }

        selectedFile = file;

        // Update dropzone UI
        dropzone.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 10px;"></i>
            <p style="color: var(--accent); font-weight: bold;">${file.name}</p>
            <small style="color: var(--text-dim);">${formatFileSize(file.size)}</small>
            <br><br>
            <small style="color: var(--text-dim);">Click to select a different file</small>
        `;

        showNotification('Encrypted file loaded successfully!', 'success');
    }

    // RSA key input formatting
    if (rsaKeyInput) {
        rsaKeyInput.addEventListener('input', function() {
            // Convert to uppercase, allow alphanumeric and dashes
            let value = this.value.toUpperCase();
            this.value = value;
        });

        // Validate on blur
        rsaKeyInput.addEventListener('blur', function() {
            const value = this.value.trim().replace(/[^A-Z0-9]/g, '');
            if (value && value.length !== 12) {
                showNotification('RSA key should be 12 characters (e.g., X9X5OXCTXI8N)', 'error');
                this.style.borderColor = '#ff4d4d';
            } else {
                this.style.borderColor = '';
            }
        });
    }

    // Execute decryption
    if (decryptButton) {
        decryptButton.addEventListener('click', function() {
            if (!selectedFile) {
                showNotification('Please select an encrypted file first', 'error');
                return;
            }

            const rsaKey = rsaKeyInput ? rsaKeyInput.value.trim() : '';
            if (!rsaKey) {
                showNotification('Please enter the RSA key', 'error');
                rsaKeyInput.focus();
                return;
            }

            // Remove dashes for validation and submission
            const rsaKeyClean = rsaKey.replace(/[^A-Z0-9]/g, '');
            if (rsaKeyClean.length !== 12) {
                showNotification('Invalid RSA key format. Should be 12 characters (e.g., X9X5OXCTXI8N)', 'error');
                return;
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('encrypted_file', selectedFile);
            formData.append('rsa_key', rsaKeyClean);

            // Show loading state
            rightPanel.style.display = 'block';
            loading.style.display = 'block';
            resultView.style.display = 'none';
            decryptButton.disabled = true;
            decryptButton.textContent = 'Decrypting...';

            // Send AJAX request
            fetch('/decrypt', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Hide loading, show result
                    setTimeout(() => {
                        loading.style.display = 'none';
                        displayResults(data);
                        resultView.style.display = 'block';
                        decryptButton.disabled = false;
                        decryptButton.textContent = 'Initialize Restoration';
                    }, 2000); // Simulated processing time
                } else {
                    throw new Error(data.error || 'Decryption failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loading.style.display = 'none';
                rightPanel.style.display = 'none';
                decryptButton.disabled = false;
                decryptButton.textContent = 'Initialize Restoration';
                showNotification(error.message, 'error');
            });
        });
    }

    // Display decryption results
    function displayResults(data) {
        const filenameElement = document.getElementById('resFileName');
        const downloadButton = document.querySelector('#resultView .btn-action');

        if (filenameElement) {
            filenameElement.textContent = data.original_filename;
        }

        // Set download link
        if (downloadButton) {
            downloadButton.onclick = function() {
                window.location.href = data.download_url;
                showNotification('Download started!', 'success');
            };
        }

        showNotification('Decryption successful!', 'success');

        // Clear inputs for security
        if (rsaKeyInput) {
            setTimeout(() => {
                rsaKeyInput.value = '';
            }, 3000);
        }
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4ecca3' : type === 'error' ? '#ff4d4d' : '#4ecca3'};
            color: ${type === 'success' ? '#000' : '#fff'};
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
        `;
        
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Paste RSA key from clipboard
    if (rsaKeyInput) {
        const pasteButton = document.createElement('button');
        pasteButton.innerHTML = '<i class="fas fa-paste"></i>';
        pasteButton.style.cssText = `
            position: absolute;
            right: 50px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: var(--accent);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 5px;
        `;
        pasteButton.title = 'Paste from clipboard';
        
        rsaKeyInput.parentElement.style.position = 'relative';
        rsaKeyInput.parentElement.appendChild(pasteButton);

        pasteButton.addEventListener('click', async function() {
            try {
                const text = await navigator.clipboard.readText();
                rsaKeyInput.value = text.trim();
                rsaKeyInput.dispatchEvent(new Event('input'));
                showNotification('Pasted from clipboard', 'success');
            } catch (err) {
                showNotification('Failed to paste from clipboard', 'error');
            }
        });
    }
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .dropzone {
        transition: all 0.3s ease;
    }
    
    input[type="text"]:focus {
        box-shadow: 0 0 0 2px rgba(78, 204, 163, 0.2);
    }
`;
document.head.appendChild(style);
