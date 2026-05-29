// dashboard.js - Dashboard page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initDashboard();
    
    // Add search functionality for encryption history
    addSearchFunctionality();
    
    // Add download handlers
    setupDownloadHandlers();
});

function initDashboard() {
    // Animate table rows on load
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, index * 50);
    });

    // Add hover effect to info cards
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });

    // Update dashboard statistics
    updateStatistics();
}

function addSearchFunctionality() {
    // Create search input
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
        align-items: center;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search by filename or details...';
    searchInput.style.cssText = `
        flex: 1;
        padding: 12px;
        background: var(--bg-soft);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: var(--text-main);
        font-size: 0.9rem;
    `;

    searchContainer.appendChild(searchInput);
    tableContainer.insertBefore(searchContainer, tableContainer.firstChild);

    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const filename = row.cells[0]?.textContent.toLowerCase() || '';
            const details = row.cells[2]?.textContent.toLowerCase() || '';
            
            if (filename.includes(searchTerm) || details.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Show "no results" message if needed
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
        
        let noResultsRow = document.querySelector('.no-results-row');
        if (visibleRows.length === 0) {
            if (!noResultsRow) {
                noResultsRow = document.createElement('tr');
                noResultsRow.className = 'no-results-row';
                noResultsRow.innerHTML = `
                    <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-dim);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        No results found for "${searchTerm}"
                    </td>
                `;
                document.querySelector('tbody').appendChild(noResultsRow);
            }
        } else if (noResultsRow) {
            noResultsRow.remove();
        }
    });
}

function setupDownloadHandlers() {
    const downloadButtons = document.querySelectorAll('.btn-download');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add loading animation
            const originalHtml = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            this.style.pointerEvents = 'none';
            
            // Reset after 2 seconds (simulated download)
            setTimeout(() => {
                this.innerHTML = originalHtml;
                this.style.pointerEvents = 'auto';
                showNotification('Download started!', 'success');
            }, 1000);
        });
    });
}

function updateStatistics() {
    const rows = document.querySelectorAll('tbody tr');
    const totalEncryptions = rows.length;
    
    // You can add more statistics here
    console.log(`Total encryptions: ${totalEncryptions}`);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4ecca3' : '#ff4d4d'};
        color: ${type === 'success' ? '#000' : '#fff'};
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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
    
    .info-card {
        transition: all 0.3s ease;
    }
    
    tbody tr {
        transition: all 0.3s ease;
    }
    
    tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.02);
    }
`;
document.head.appendChild(style);
