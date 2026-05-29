// encrypt.js - Encryption page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.querySelector('.dropzone');
    const detailsTextarea = document.getElementById('imgDetails');
    const executeButton = document.querySelector('.btn-action');
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
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif'];
        
        if (!allowedTypes.includes(file.type)) {
            showNotification('Invalid file type. Please select an image file.', 'error');
            return;
        }

        // Validate file size (16MB max)
        if (file.size > 16 * 1024 * 1024) {
            showNotification('File too large. Maximum size is 16MB.', 'error');
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

        showNotification('File selected successfully!', 'success');
    }

    // Execute encryption
    if (executeButton) {
        executeButton.addEventListener('click', function() {
            if (!selectedFile) {
                showNotification('Please select an image first', 'error');
                return;
            }

            const details = detailsTextarea ? detailsTextarea.value.trim() : '';

            // Prepare form data
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('details', details);

            // Show loading state
            rightPanel.style.display = 'block';
            loading.style.display = 'block';
            resultView.style.display = 'none';
            executeButton.disabled = true;
            executeButton.textContent = 'Processing...';

            // Send AJAX request
            fetch('/encrypt', {
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
                        executeButton.disabled = false;
                        executeButton.textContent = 'Execute Protocol';
                    }, 1500); // Simulated processing time
                } else {
                    throw new Error(data.error || 'Encryption failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loading.style.display = 'none';
                rightPanel.style.display = 'none';
                executeButton.disabled = false;
                executeButton.textContent = 'Execute Protocol';
                showNotification(error.message, 'error');
            });
        });
    }

    // Display encryption results
    function displayResults(data) {
        const currentDate = document.getElementById('currentDate');
        const keyBox = document.querySelector('.key-box');
        const downloadButton = document.querySelector('#resultView .btn-action');

        if (currentDate) {
            currentDate.textContent = data.date;
        }

        if (keyBox) {
            keyBox.textContent = data.rsa_key;
            
            // Add copy to clipboard functionality
            keyBox.style.cursor = 'pointer';
            keyBox.title = 'Click to copy';
            keyBox.addEventListener('click', function() {
                copyToClipboard(data.rsa_key);
            });
        }

        // Update filename in results
        const filenameElements = document.querySelectorAll('#resultView h3');
        if (filenameElements.length > 0) {
            filenameElements[0].textContent = data.encrypted_filename;
        }

        // Set download link
        if (downloadButton) {
            downloadButton.onclick = function() {
                window.location.href = data.download_url;
                showNotification('Download started!', 'success');
            };
        }

        showNotification('Encryption successful! Key sent to email.', 'success');
    }

    // Copy to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('RSA key copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('RSA key copied to clipboard!', 'success');
        });
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
    
    .key-box:hover {
        transform: scale(1.02);
        box-shadow: 0 0 20px rgba(78, 204, 163, 0.3);
    }
`;
document.head.appendChild(style);
