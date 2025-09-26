/**
 * ================================================================
 *          BYPASS DNU E-LEARNING EXTENSION - MAIN WORLD SCRIPT
 * ================================================================
 * Script chạy trực tiếp trong main world để truy cập SCORM API
 */

(function() {
    'use strict';
    
    console.log('🚀 Bypass DNU Extension: Starting in MAIN WORLD...');
    
    // Bypass debugger protection
    try {
        const noop = () => {};
        window.debugger = noop;
        Object.defineProperty(window, 'debugger', { get: noop, set: noop });
        
        // Override Function constructor to block debugger
        const originalFunction = Function;
        window.Function = function(...args) {
            const code = args[args.length - 1];
            if (typeof code === 'string' && code.includes('debugger')) {
                console.log('🚫 Blocked debugger in injected script');
                args[args.length - 1] = code.replace(/debugger\s*;?/g, '');
            }
            return originalFunction.apply(this, args);
        };
        
        console.log('🛡️ Anti-debugging bypass activated');
    } catch (e) {
        console.log('⚠️ Could not bypass debugger protection:', e);
    }
    
    // Tránh chạy nhiều lần
    if (window.bypassDNUActive) {
        console.log('Extension already active, skipping...');
        return;
    }

    // --- PHẦN 1: CONSTANTS & CORE FUNCTIONS ---
    
    // Debug SCORM API detection
    console.log('🔍 SCORM API Debug (Main World):', {
        'window.API_1484_11': !!window.API_1484_11,
        'window.API': !!window.API,
        'window.Scorm2004API': !!window.Scorm2004API,
        'typeof API_1484_11': typeof window.API_1484_11,
        'available APIs': Object.keys(window).filter(key => key.toLowerCase().includes('api')),
        'current URL': window.location.href
    });

    // Try multiple SCORM API variants
    const scormApi = window.API_1484_11 || window.Scorm2004API || window.API;
    const STORAGE_KEY = 'bypass-dnu-gui-state';
    const ACTIVE_KEY = 'bypass-dnu-active';
    let currentPanel = null;
    
    console.log('Selected SCORM API (Main World):', !!scormApi, scormApi);

    // Storage functions với fallback
    const storage = {
        get: (key) => {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (e) {
                console.log('Storage get error:', e);
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.log('Storage set error:', e);
            }
        },
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.log('Storage remove error:', e);
            }
        }
    };

    function saveGUIState(left, top, visible) {
        const state = {
            left: left,
            top: top,
            visible: visible,
            timestamp: Date.now()
        };
        storage.set(STORAGE_KEY, state);
    }

    function loadGUIState() {
        const state = storage.get(STORAGE_KEY);
        if (state && Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
            return state;
        }
        return null;
    }

    function showStatus(panel, message, isError = false) {
        let statusDiv = panel.querySelector('.helper-status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'helper-status';
            statusDiv.style.cssText = `
                margin-top: 10px;
                padding: 8px;
                border-radius: 6px;
                font-size: 12px;
                text-align: center;
                transition: all 0.3s ease;
                font-weight: 500;
            `;
            panel.appendChild(statusDiv);
        }
        
        statusDiv.textContent = message;
        statusDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        statusDiv.style.color = isError ? '#c62828' : '#2e7d32';
        statusDiv.style.opacity = '1';
        
        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.textContent = '';
                    statusDiv.style.backgroundColor = 'transparent';
                }
            }, 300);
        }, 4000);
    }

    function waitForCompletionIcon(panel) {
        showStatus(panel, 'Đang chờ xác nhận từ máy chủ...');
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                observer.disconnect();
                reject(new Error("Quá thời gian chờ nhưng không thấy icon hoàn thành"));
            }, 25000);

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        const checkmark = document.querySelector("[id^='completed-sign-'] svg");
                        if (checkmark) {
                            clearTimeout(timeout);
                            observer.disconnect();
                            console.log('✅ Completion icon found!');
                            resolve();
                            return;
                        }
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    function completeNormalLesson(panel) {
        console.log('🎬 Attempting to complete lesson...', { 
            scormApi: !!scormApi,
            apiMethods: scormApi ? Object.getOwnPropertyNames(scormApi) : 'N/A'
        });
        
        if (!scormApi) {
            showStatus(panel, 'Lỗi: Không tìm thấy SCORM API!', true);
            console.error('❌ SCORM API not available');
            return;
        }
        
        showStatus(panel, 'Đang gửi lệnh hoàn thành bài giảng...');
        
        try {
            console.log('Setting completion status...');
            const result1 = scormApi.SetValue('cmi.completion_status', 'completed');
            const result2 = scormApi.SetValue('cmi.success_status', 'passed');
            const commitResult = scormApi.Commit('');
            
            console.log('SCORM Results:', { 
                setCompletion: result1, 
                setSuccess: result2, 
                commit: commitResult 
            });
            
            waitForCompletionIcon(panel)
                .then(() => {
                    showStatus(panel, '✅ Bài giảng đã hoàn thành!');
                    console.log('🎉 Lesson completed successfully!');
                })
                .catch(err => {
                    showStatus(panel, `Hoàn thành nhưng chưa thấy icon: ${err.message}`, false);
                    console.log('⚠️ Completion sent but icon not detected:', err);
                });
                
        } catch (e) {
            showStatus(panel, `Lỗi SCORM: ${e.message}`, true);
            console.error('❌ SCORM Error:', e);
        }
    }

    function passTheQuiz(panel) {
        console.log('📝 Attempting to pass quiz...', { scormApi: !!scormApi });
        
        if (!scormApi) {
            showStatus(panel, 'Lỗi: Không tìm thấy SCORM API!', true);
            console.error('❌ SCORM API not available for quiz');
            return;
        }
        
        showStatus(panel, 'Đang gửi kết quả trắc nghiệm...');
        
        try {
            const results = {
                'cmi.score.raw': '100',
                'cmi.score.max': '100', 
                'cmi.score.min': '0',
                'cmi.score.scaled': '1.0',
                'cmi.success_status': 'passed',
                'cmi.completion_status': 'completed'
            };

            console.log('Setting quiz SCORM values:', results);
            
            for (const key in results) {
                const result = scormApi.SetValue(key, results[key]);
                console.log(`Set ${key}: ${result}`);
            }
            
            const commitResult = scormApi.Commit('');
            console.log('Quiz commit result:', commitResult);
            
            waitForCompletionIcon(panel)
                .then(() => {
                    showStatus(panel, '✅ Trắc nghiệm đã hoàn thành với điểm 100%!');
                    console.log('🎉 Quiz passed with 100%!');
                })
                .catch(err => {
                    showStatus(panel, `Hoàn thành nhưng chưa thấy icon: ${err.message}`, false);
                    console.log('⚠️ Quiz completion sent but icon not detected:', err);
                });
                
        } catch (e) {
            showStatus(panel, `Lỗi SCORM: ${e.message}`, true);
            console.error('❌ Quiz SCORM Error:', e);
        }
    }

    // --- PANEL CREATION ---

    function createPanel() {
        console.log('🎯 Creating GUI panel...');
        
        // Remove old panel
        const oldPanel = document.getElementById('bypass-dnu-panel');
        if (oldPanel) {
            oldPanel.remove();
        }

        const savedState = loadGUIState();
        
        const panel = document.createElement('div');
        panel.id = 'bypass-dnu-panel';
        panel.style.cssText = `
            position: fixed;
            width: 260px;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            border: 1px solid #ddd;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            padding: 16px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #333;
            transition: all 0.3s ease;
        `;
        
        // Position
        if (savedState) {
            panel.style.left = savedState.left + 'px';
            panel.style.top = savedState.top + 'px';
        } else {
            panel.style.top = '20px';
            panel.style.right = '20px';
        }

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            cursor: move;
            padding-bottom: 12px;
            margin-bottom: 12px;
            border-bottom: 2px solid #eee;
            text-align: center;
            font-weight: 600;
            font-size: 15px;
            color: #1976d2;
            user-select: none;
        `;
        header.innerHTML = '📚 Bypass DNU E-Learning';
        panel.appendChild(header);

        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            font-size: 11px;
            text-align: center;
            margin-bottom: 12px;
            padding: 6px 10px;
            border-radius: 8px;
            font-weight: 500;
        `;
        
        if (scormApi) {
            statusIndicator.style.backgroundColor = '#e8f5e9';
            statusIndicator.style.color = '#2e7d32';
            statusIndicator.textContent = '✅ SCORM API sẵn sàng';
        } else {
            statusIndicator.style.backgroundColor = '#fff3e0';
            statusIndicator.style.color = '#f57c00';
            statusIndicator.textContent = '⏳ Đang chờ SCORM API...';
        }
        panel.appendChild(statusIndicator);

        // Buttons
        const btn1 = document.createElement('button');
        btn1.innerHTML = '🎬 Hoàn thành Video/Bài giảng';
        btn1.onclick = () => completeNormalLesson(panel);
        
        const btn2 = document.createElement('button');
        btn2.innerHTML = '📝 Vượt qua bài trắc nghiệm';
        btn2.onclick = () => passTheQuiz(panel);
        
        // Button styles
        [btn1, btn2].forEach((btn, index) => {
            btn.style.cssText = `
                width: 100%;
                padding: 12px 16px;
                border: none;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                color: white;
            `;
            
            if (index === 0) {
                btn.style.background = 'linear-gradient(135deg, #4285f4, #1976d2)';
            } else {
                btn.style.background = 'linear-gradient(135deg, #34a853, #2e7d32)';
            }
            
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
            
            btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.98)');
            btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
        });

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            text-align: center;
            font-size: 11px;
            color: #999;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        `;
        footer.innerHTML = 'Made by vanhxyz';
        
        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = ' | ❌ Tắt';
        closeBtn.style.cssText = `
            cursor: pointer;
            color: #d93025;
            transition: color 0.2s ease;
        `;
        closeBtn.title = 'Tắt extension và ẩn panel';
        
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = '#b71c1c');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = '#d93025');
        
        closeBtn.onclick = () => {
            if (confirm('Bạn có chắc muốn tắt extension? Panel sẽ không hiện cho đến khi reload trang.')) {
                storage.remove(ACTIVE_KEY);
                storage.remove(STORAGE_KEY);
                panel.remove();
                window.bypassDNUActive = false;
                currentPanel = null;
                console.log('🛑 Extension disabled by user');
            }
        };
        footer.appendChild(closeBtn);

        // Add elements to panel
        panel.appendChild(btn1);
        panel.appendChild(btn2);  
        panel.appendChild(footer);
        
        // Add to DOM
        document.body.appendChild(panel);
        currentPanel = panel;

        // Drag functionality
        setupDragFunctionality(panel, header);

        console.log('✅ Panel created successfully!', {
            hasScormApi: !!scormApi,
            panelId: panel.id
        });
        
        return panel;
    }

    function setupDragFunctionality(panel, header) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = panel.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            panel.style.boxShadow = '0 12px 48px rgba(0,0,0,0.2)';
            panel.style.transform = 'scale(1.02)';
            header.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        function handleMouseMove(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            
            saveGUIState(newLeft, newTop, true);
        }

        function handleMouseUp(e) {
            if (!isDragging) return;
            
            isDragging = false;
            
            panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
            panel.style.transform = 'scale(1)';
            header.style.cursor = 'move';
            document.body.style.userSelect = '';
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        header.addEventListener('dragstart', e => e.preventDefault());
        header.addEventListener('selectstart', e => e.preventDefault());
    }

    // --- MESSAGE HANDLING & API ---

    // Expose functions to popup
    window.bypassDNUExtension = {
        getStatus: () => ({
            hasPanel: !!currentPanel,
            hasScormApi: !!scormApi,
            isActive: !!window.bypassDNUActive,
            url: window.location.href
        }),
        createPanel: createPanel,
        togglePanel: () => {
            if (currentPanel) {
                currentPanel.remove();
                currentPanel = null;
                return 'Panel đã ẩn';
            } else {
                createPanel();
                return 'Panel đã hiển thị';
            }
        },
        completeLesson: () => {
            if (currentPanel) {
                completeNormalLesson(currentPanel);
                return 'Đang hoàn thành bài học';
            }
            return 'Panel không có sẵn';
        },
        passQuiz: () => {
            if (currentPanel) {
                passTheQuiz(currentPanel);
                return 'Đang vượt qua trắc nghiệm';
            }
            return 'Panel không có sẵn';
        }
    };

    // --- INITIALIZATION ---
    
    function init() {
        console.log('🎬 Initializing Bypass DNU Extension...');
        
        // Check if should auto-start
        const shouldStart = storage.get(ACTIVE_KEY) !== false; // Default true
        
        if (shouldStart) {
            createPanel();
        }
        
        // Save active state
        storage.set(ACTIVE_KEY, true);
        window.bypassDNUActive = true;
        
        console.log('🎉 Bypass DNU Extension initialized!', {
            autoStarted: shouldStart,
            scormAvailable: !!scormApi,
            currentUrl: window.location.href
        });
    }

    // Wait for DOM if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to ensure SCORM API is loaded
        setTimeout(init, 500);
    }

})();

console.log('📋 Bypass DNU Extension: Main world script loaded');