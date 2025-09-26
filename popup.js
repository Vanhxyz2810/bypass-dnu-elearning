/**
 * ================================================================
 *          BYPASS DNU E-LEARNING EXTENSION - POPUP SCRIPT
 * ================================================================
 * Quản lý giao diện popup và giao tiếp với content script
 */

(function() {
    'use strict';

    // DOM Elements
    const elements = {
        pageStatus: document.getElementById('pageStatus'),
        scormStatus: document.getElementById('scormStatus'),
        panelStatus: document.getElementById('panelStatus'),
        togglePanelBtn: document.getElementById('togglePanelBtn'),
        completeLessonBtn: document.getElementById('completeLessonBtn'),
        passQuizBtn: document.getElementById('passQuizBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        resetBtn: document.getElementById('resetBtn'),
        loading: document.getElementById('loading'),
        notification: document.getElementById('notification')
    };

    let currentTab = null;
    let isCompatibleSite = false;

    // Utility Functions
    function showLoading(show = true) {
        if (show) {
            elements.loading.classList.add('show');
        } else {
            elements.loading.classList.remove('show');
        }
    }

    function showNotification(message, type = 'success', duration = 3000) {
        elements.notification.textContent = message;
        elements.notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, duration);
    }

    function updateStatus(element, text, type) {
        element.textContent = text;
        element.className = `status-value status-${type}`;
    }

    function updateButtonState(button, enabled, text) {
        button.disabled = !enabled;
        if (text) {
            const titleElement = button.querySelector('.btn-title');
            if (titleElement) titleElement.textContent = text;
        }
    }

    // Chrome Extension API Helpers
    function getCurrentTab(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                callback(tabs[0]);
            } else {
                callback(null);
            }
        });
    }

    // Legacy function - no longer used since we removed content script
    function sendMessageToTab(tabId, message, callback) {
        const action = message.action;
        console.log(`📤 Sending message to tab ${tabId}:`, action);
        
        // Fallback approach - inject và check multiple ways
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (actionName) => {
                try {
                    console.log('🔍 Checking extension in main world...', {
                        hasExtension: !!window.bypassDNUExtension,
                        hasAPI: !!window.API_1484_11,
                        hasBypassActive: !!window.bypassDNUActive,
                        currentURL: window.location.href
                    });

                    // Method 1: Check new API
                    if (window.bypassDNUExtension) {
                        const methods = Object.keys(window.bypassDNUExtension);
                        console.log('📋 Available methods:', methods);
                        
                        if (actionName === 'checkStatus') {
                            const status = window.bypassDNUExtension.getStatus();
                            return { 
                                success: true, 
                                data: status,
                                method: 'new-api'
                            };
                        }
                        
                        // Other actions
                        const methodMap = {
                            'togglePanel': 'togglePanel',
                            'completeLesson': 'completeLesson', 
                            'passQuiz': 'passQuiz'
                        };
                        
                        const method = methodMap[actionName];
                        console.log('🔍 Looking for method:', method, 'Available:', !!window.bypassDNUExtension[method]);
                        
                        if (method && window.bypassDNUExtension[method]) {
                            console.log('✅ Calling method:', method);
                            const result = window.bypassDNUExtension[method]();
                            return { 
                                success: true, 
                                data: result,
                                method: 'new-api'
                            };
                        } else {
                            console.log('❌ Method not found:', method);
                        }
                    } else {
                        console.log('❌ window.bypassDNUExtension not found');
                    }
                    
                    // Method 2: Check old way (fallback) 
                    if (actionName === 'checkStatus') {
                        return {
                            success: true,
                            data: {
                                hasPanel: !!document.getElementById('bypass-dnu-panel'),
                                hasScormApi: !!window.API_1484_11,
                                isActive: !!window.bypassDNUActive,
                                url: window.location.href
                            },
                            method: 'fallback'
                        };
                    }
                    
                    // Method 3: Direct function calls (last resort)
                    if (actionName === 'completeLesson' || actionName === 'passQuiz') {
                        console.log('🔄 Trying direct function call for:', actionName);
                        
                        const panel = document.getElementById('bypass-dnu-panel');
                        if (!panel) {
                            console.log('❌ No panel found, cannot execute action');
                            return { success: false, error: 'Panel not found' };
                        }
                        
                        // Direct execution based on action
                        if (actionName === 'completeLesson') {
                            // Call complete lesson directly
                            const scormApi = window.API_1484_11 || window.Scorm2004API || window.API;
                            if (scormApi) {
                                console.log('🎬 Direct lesson completion');
                                try {
                                    scormApi.SetValue('cmi.completion_status', 'completed');
                                    scormApi.SetValue('cmi.success_status', 'passed');
                                    scormApi.Commit('');
                                    return { success: true, data: 'Bài học đã hoàn thành!' };
                                } catch (e) {
                                    return { success: false, error: 'SCORM Error: ' + e.message };
                                }
                            } else {
                                return { success: false, error: 'SCORM API not available' };
                            }
                        }
                        
                        if (actionName === 'passQuiz') {
                            // Call pass quiz directly
                            const scormApi = window.API_1484_11 || window.Scorm2004API || window.API;
                            if (scormApi) {
                                console.log('📝 Direct quiz completion');
                                try {
                                    const results = {
                                        'cmi.score.raw': '100',
                                        'cmi.score.max': '100', 
                                        'cmi.score.min': '0',
                                        'cmi.score.scaled': '1.0',
                                        'cmi.success_status': 'passed',
                                        'cmi.completion_status': 'completed'
                                    };
                                    
                                    for (const key in results) {
                                        scormApi.SetValue(key, results[key]);
                                    }
                                    scormApi.Commit('');
                                    return { success: true, data: 'Trắc nghiệm hoàn thành 100%!' };
                                } catch (e) {
                                    return { success: false, error: 'SCORM Error: ' + e.message };
                                }
                            } else {
                                return { success: false, error: 'SCORM API not available' };
                            }
                        }
                    }
                    
                    // Method 4: Panel toggle 
                    if (actionName === 'togglePanel') {
                        console.log('🔧 Direct panel toggle');
                        const panel = document.getElementById('bypass-dnu-panel');
                        if (panel) {
                            panel.remove();
                            return { success: true, data: 'Panel đã ẩn' };
                        } else {
                            // Try to create panel if script is available
                            if (typeof createPanel === 'function') {
                                createPanel();
                                return { success: true, data: 'Panel đã hiển thị' };
                            } else {
                                return { success: false, error: 'Cannot create panel - script not loaded' };
                            }
                        }
                    }
                    
                    return { 
                        success: false, 
                        error: 'Extension not loaded',
                        debug: {
                            hasExtension: !!window.bypassDNUExtension,
                            hasBypassActive: !!window.bypassDNUActive,
                            hasAPI: !!window.API_1484_11,
                            action: actionName,
                            url: window.location.href
                        }
                    };
                    
                } catch (error) {
                    console.error('❌ Script execution error:', error);
                    return { 
                        success: false, 
                        error: error.message,
                        stack: error.stack
                    };
                }
            },
            args: [action]
        }).then((results) => {
            console.log('📥 Script execution results:', results);
            
            if (results && results[0] && results[0].result) {
                const result = results[0].result;
                
                if (result.success) {
                    console.log('✅ Success with method:', result.method);
                    if (typeof result.data === 'string') {
                        callback({ status: 'success', message: result.data });
                    } else {
                        callback({ status: 'success', data: result.data });
                    }
                } else {
                    console.log('❌ Extension error:', result);
                    callback({ 
                        status: 'error', 
                        message: result.error || 'Unknown error',
                        debug: result.debug
                    });
                }
            } else {
                console.log('❌ No result returned from script');
                callback({ status: 'error', message: 'No result returned from injected script' });
            }
        }).catch(error => {
            console.error('❌ Chrome scripting API error:', error);
            callback({ 
                status: 'error', 
                message: 'Chrome API error: ' + error.message,
                chromeError: error
            });
        });
    }

    // Removed legacy functions - no longer needed after simplification

    // Legacy function - kept for reference but not used
    function injectFallbackScript(tabId, callback) {
        console.log('💉 Injecting fallback script to tab:', tabId);
        
        // Fallback script content (inline để tránh file load issues)
        const fallbackScript = `
(function() {
    console.log('🚀 Bypass DNU: Fallback injection started...');
    
    if (window.bypassDNUActive) {
        console.log('Extension already active');
        return 'already-active';
    }

    // Debug SCORM API detection
    console.log('🔍 SCORM API Debug:', {
        'window.API_1484_11': !!window.API_1484_11,
        'window.API': !!window.API,
        'window.Scorm2004API': !!window.Scorm2004API,
        'typeof API_1484_11': typeof window.API_1484_11,
        'available APIs': Object.keys(window).filter(key => key.toLowerCase().includes('api'))
    });

    // Try multiple SCORM API variants
    const scormApi = window.API_1484_11 || window.Scorm2004API || window.API;
    const STORAGE_KEY = 'bypass-dnu-gui-state';
    console.log('Selected SCORM API:', !!scormApi, scormApi);

    function saveGUIState(left, top) {
        try {
            const state = { left, top, visible: true, timestamp: Date.now() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function loadGUIState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) return state;
            }
        } catch (e) {}
        return null;
    }

    function showStatus(panel, message, isError = false) {
        let statusDiv = panel.querySelector('.helper-status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'helper-status';
            statusDiv.style.cssText = 'margin-top:10px;padding:8px;border-radius:6px;font-size:12px;text-align:center;transition:all 0.3s ease;';
            panel.appendChild(statusDiv);
        }
        statusDiv.textContent = message;
        statusDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        statusDiv.style.color = isError ? '#c62828' : '#2e7d32';
        setTimeout(() => statusDiv.style.opacity = '0', 4000);
    }

    function completeLesson(panel) {
        console.log('🎬 Complete lesson called');
        if (!scormApi) {
            showStatus(panel, 'Lỗi: SCORM API không có sẵn!', true);
            return;
        }
        
        showStatus(panel, 'Đang hoàn thành bài học...');
        try {
            scormApi.SetValue('cmi.completion_status', 'completed');
            scormApi.SetValue('cmi.success_status', 'passed');
            scormApi.Commit('');
            setTimeout(() => showStatus(panel, '✅ Bài học đã hoàn thành!'), 1000);
        } catch (e) {
            showStatus(panel, 'Lỗi: ' + e.message, true);
        }
    }

    function passQuiz(panel) {
        console.log('📝 Pass quiz called');
        if (!scormApi) {
            showStatus(panel, 'Lỗi: SCORM API không có sẵn!', true);
            return;
        }
        
        showStatus(panel, 'Đang vượt qua trắc nghiệm...');
        try {
            const results = {
                'cmi.score.raw': '100', 'cmi.score.max': '100', 'cmi.score.min': '0',
                'cmi.score.scaled': '1.0', 'cmi.success_status': 'passed', 'cmi.completion_status': 'completed'
            };
            
            for (const key in results) scormApi.SetValue(key, results[key]);
            scormApi.Commit('');
            setTimeout(() => showStatus(panel, '✅ Trắc nghiệm hoàn thành 100%!'), 1000);
        } catch (e) {
            showStatus(panel, 'Lỗi: ' + e.message, true);
        }
    }

    function createPanel() {
        console.log('🎯 Creating panel...');
        
        const oldPanel = document.getElementById('bypass-dnu-panel');
        if (oldPanel) oldPanel.remove();

        const savedState = loadGUIState();
        const panel = document.createElement('div');
        panel.id = 'bypass-dnu-panel';
        panel.style.cssText = \`
            position: fixed; width: 260px; background: rgba(255,255,255,0.98);
            backdrop-filter: blur(10px); border: 1px solid #ddd; border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15); padding: 16px; z-index: 999999;
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
            color: #333; transition: all 0.3s ease;
            \${savedState ? \`left:\${savedState.left}px;top:\${savedState.top}px;\` : 'top:20px;right:20px;'}
        \`;

        const header = document.createElement('div');
        header.style.cssText = 'cursor:move;padding-bottom:12px;margin-bottom:12px;border-bottom:2px solid #eee;text-align:center;font-weight:600;font-size:15px;color:#1976d2;user-select:none;';
        header.innerHTML = '📚 Bypass DNU E-Learning';
        panel.appendChild(header);

        const status = document.createElement('div');
        status.style.cssText = 'font-size:11px;text-align:center;margin-bottom:12px;padding:6px 10px;border-radius:8px;font-weight:500;';
        if (scormApi) {
            status.style.cssText += 'background-color:#e8f5e9;color:#2e7d32;';
            status.textContent = '✅ SCORM API sẵn sàng';
        } else {
            status.style.cssText += 'background-color:#fff3e0;color:#f57c00;';
            status.textContent = '⏳ SCORM API chưa sẵn sàng';
        }
        panel.appendChild(status);

        const btn1 = document.createElement('button');
        btn1.innerHTML = '🎬 Hoàn thành Video/Bài giảng';
        btn1.onclick = () => completeLesson(panel);
        btn1.style.cssText = 'width:100%;padding:12px;border:none;border-radius:8px;margin-bottom:10px;cursor:pointer;font-weight:600;font-size:13px;background:linear-gradient(135deg,#4285f4,#1976d2);color:white;';
        
        const btn2 = document.createElement('button');
        btn2.innerHTML = '📝 Vượt qua bài trắc nghiệm';
        btn2.onclick = () => passQuiz(panel);
        btn2.style.cssText = 'width:100%;padding:12px;border:none;border-radius:8px;margin-bottom:10px;cursor:pointer;font-weight:600;font-size:13px;background:linear-gradient(135deg,#34a853,#2e7d32);color:white;';

        const footer = document.createElement('div');
        footer.style.cssText = 'text-align:center;font-size:11px;color:#999;margin-top:12px;padding-top:10px;border-top:1px solid #eee;';
        footer.innerHTML = 'Made by vanhxyz <span id="close-btn" style="cursor:pointer;color:#d93025;"> | ❌ Tắt</span>';
        
        footer.querySelector('#close-btn').onclick = () => {
            if (confirm('Tắt extension?')) {
                panel.remove();
                localStorage.removeItem('bypass-dnu-active');
                localStorage.removeItem(STORAGE_KEY);
                window.bypassDNUActive = false;
            }
        };

        panel.appendChild(btn1);
        panel.appendChild(btn2);
        panel.appendChild(footer);
        document.body.appendChild(panel);

        // Simple drag
        let isDragging = false, startX, startY, initialLeft, initialTop;
        header.onmousedown = (e) => {
            if (e.button !== 0) return;
            isDragging = true; startX = e.clientX; startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            
            const handleMove = (e) => {
                if (!isDragging) return;
                const deltaX = e.clientX - startX, deltaY = e.clientY - startY;
                let newLeft = initialLeft + deltaX, newTop = initialTop + deltaY;
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
                panel.style.left = newLeft + 'px'; panel.style.top = newTop + 'px';
                saveGUIState(newLeft, newTop);
            };
            
            const handleUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
            };
            
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        };

        console.log('✅ Panel created!');
        return panel;
    }

    // API for popup
    window.bypassDNUExtension = {
        getStatus: () => ({
            hasPanel: !!document.getElementById('bypass-dnu-panel'),
            hasScormApi: !!scormApi,
            isActive: true,
            url: window.location.href
        }),
        createPanel: createPanel,
        togglePanel: () => {
            const panel = document.getElementById('bypass-dnu-panel');
            if (panel) { panel.remove(); return 'Panel đã ẩn'; }
            else { createPanel(); return 'Panel đã hiển thị'; }
        },
        completeLesson: () => {
            const panel = document.getElementById('bypass-dnu-panel') || createPanel();
            completeLesson(panel);
            return 'Đang hoàn thành bài học';
        },
        passQuiz: () => {
            const panel = document.getElementById('bypass-dnu-panel') || createPanel();
            passQuiz(panel);
            return 'Đang vượt qua trắc nghiệm';
        }
    };

    // Initialize
    const shouldStart = localStorage.getItem('bypass-dnu-active') !== 'false';
    if (shouldStart) createPanel();
    
    localStorage.setItem('bypass-dnu-active', 'true');
    window.bypassDNUActive = true;
    
    console.log('🎉 Bypass DNU Extension loaded via fallback!');
    return 'success';
})();
        `;
        
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (scriptCode) => {
                try {
                    return eval(scriptCode);
                } catch (error) {
                    console.error('Fallback script error:', error);
                    return { error: error.message };
                }
            },
            args: [fallbackScript]
        }).then((results) => {
            console.log('💉 Fallback injection results:', results);
            
            if (results && results[0] && results[0].result) {
                const result = results[0].result;
                if (result === 'success' || result === 'already-active') {
                    callback({ success: true, message: 'Fallback script injected successfully' });
                } else if (result && result.error) {
                    callback({ success: false, error: result.error });
                } else {
                    callback({ success: false, error: 'Unknown injection result' });
                }
            } else {
                callback({ success: false, error: 'No results from injection' });
            }
        }).catch(error => {
            console.error('💉 Fallback injection failed:', error);
            callback({ success: false, error: error.message });
        });
    }

    // Status Check Functions
    function checkSiteCompatibility(url) {
        if (!url) return false;
        
        const compatibleDomains = [
            'dainam.edu.vn',
            'elearning.dainam.edu.vn'
        ];
        
        return compatibleDomains.some(domain => url.includes(domain));
    }

    function checkExtensionStatus() {
        showLoading(true);
        console.log('🔍 Starting extension status check...');

        getCurrentTab((tab) => {
            if (!tab) {
                console.error('❌ No active tab found');
                updateStatus(elements.pageStatus, 'Lỗi Tab', 'error');
                showLoading(false);
                return;
            }

            console.log('📋 Current tab:', { id: tab.id, url: tab.url });
            currentTab = tab;
            isCompatibleSite = checkSiteCompatibility(tab.url);

            // Kiểm tra trang web
            if (isCompatibleSite) {
                console.log('✅ Compatible site detected');
                updateStatus(elements.pageStatus, 'Trang hỗ trợ', 'success');
                updateStatus(elements.scormStatus, 'Đang khởi tạo...', 'warning');
                updateStatus(elements.panelStatus, 'Đang inject...', 'warning');
                
                // Disable all buttons during injection
                updateButtonState(elements.togglePanelBtn, false, 'Đang kích hoạt...');
                updateButtonState(elements.completeLessonBtn, false);
                updateButtonState(elements.passQuizBtn, false);
                
                showNotification('Đang tự động kích hoạt Bypass GUI...', 'success', 1000);
                
        // Check nếu GUI đã có sẵn từ trước
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                return {
                    hasPanel: !!document.getElementById('bypass-dnu-panel'),
                    hasOverlay: !!document.getElementById('bypass-dnu-overlay'),
                    isActive: !!window.bypassDNUActive
                };
            }
        }).then((results) => {
            const status = results[0]?.result;
            
            if (status && (status.hasPanel || status.isActive)) {
                // GUI đã có sẵn, không cần inject
                console.log('🔍 GUI already exists, skipping auto-inject');
                updateStatus(elements.scormStatus, 'Hoạt động', 'success');
                updateStatus(elements.panelStatus, 'GUI đã sẵn sàng', 'success');
                updateButtonState(elements.togglePanelBtn, true, 'GUI đã có sẵn');
                showNotification('GUI đã được kích hoạt từ trước!', 'info', 2000);
                showLoading(false);
            } else {
                // Chưa có GUI, auto-inject với delay
                setTimeout(() => {
                    autoInjectGUI();
                }, 800);
            }
        }).catch(error => {
            console.log('Error checking GUI status:', error);
            // Fallback: inject anyway
            setTimeout(() => {
                autoInjectGUI();
            }, 800);
        });
            } else {
                console.log('❌ Incompatible site:', tab.url);
                updateStatus(elements.pageStatus, 'Trang không hỗ trợ', 'error');
                updateStatus(elements.scormStatus, 'N/A', 'warning');
                updateStatus(elements.panelStatus, 'N/A', 'warning');
                disableButtons();
                showLoading(false);
                showNotification('Vui lòng truy cập trang elearning.dainam.edu.vn', 'warning', 4000);
                return;
            }

        });
    }

    function disableButtons() {
        updateButtonState(elements.togglePanelBtn, false);
        updateButtonState(elements.completeLessonBtn, false);
        updateButtonState(elements.passQuizBtn, false);
    }

    // Button Event Handlers
    function autoInjectGUI() {
        if (!currentTab || !isCompatibleSite) {
            showNotification('Vui lòng truy cập trang học tập của DNU', 'error');
            return;
        }

        showLoading(false); // Tắt loading popup vì sẽ có loading overlay
        console.log('🚀 Auto-injecting Bypass GUI...');
        
        // Inject loading overlay + GUI script
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                // Xóa overlay cũ nếu có và restore scrolling
                const oldOverlay = document.getElementById('bypass-dnu-overlay');
                if (oldOverlay) {
                    oldOverlay.remove();
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                }
                
                // Tạo loading overlay
                const overlay = document.createElement('div');
                overlay.id = 'bypass-dnu-overlay';
                
                // Force full screen với !important trong cssText
                overlay.style.cssText = [
                    'position: fixed !important',
                    'top: 0 !important',
                    'left: 0 !important', 
                    'right: 0 !important',
                    'bottom: 0 !important',
                    'width: 100% !important',
                    'height: 100% !important',
                    'max-width: none !important',
                    'max-height: none !important',
                    'margin: 0 !important',
                    'padding: 0 !important',
                    'border: none !important',
                    'outline: none !important',
                    'background: linear-gradient(135deg, rgba(66,133,244,0.95), rgba(52,168,83,0.95)) !important',
                    'backdrop-filter: blur(20px) !important',
                    'z-index: 2147483647 !important',
                    'display: flex !important',
                    'flex-direction: column !important',
                    'justify-content: center !important',
                    'align-items: center !important',
                    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
                    'color: white !important',
                    'text-align: center !important',
                    'box-sizing: border-box !important',
                    'overflow: hidden !important'
                ].join('; ');
                
                // Thêm vào body với style body override
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                
                console.log('🎨 Full screen overlay created with !important styles');
                
                overlay.innerHTML = 
                    '<div style="margin-bottom: 40px;">' +
                        '<div style="font-size: 48px; margin-bottom: 20px;">🚀</div>' +
                        '<h1 style="font-size: 32px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">' +
                            'Bypass DNU E-Learning' +
                        '</h1>' +
                        '<p style="font-size: 16px; opacity: 0.9; margin: 0;">' +
                            'Đang khởi tạo giao diện bypass...' +
                        '</p>' +
                    '</div>' +
                    
                    '<div style="width: 300px; margin-bottom: 30px;">' +
                        '<div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; overflow: hidden;">' +
                            '<div id="progress-bar" style="' +
                                'background: linear-gradient(90deg, #fff, rgba(255,255,255,0.8));' +
                                'height: 100%; width: 0%; border-radius: 4px;' +
                                'transition: width 0.3s ease;' +
                                'box-shadow: 0 0 10px rgba(255,255,255,0.5);' +
                            '"></div>' +
                        '</div>' +
                        '<div id="progress-text" style="margin-top: 10px; font-size: 14px; opacity: 0.8;">' +
                            'Bắt đầu khởi tạo... 0%' +
                        '</div>' +
                    '</div>' +
                    
                    '<div style="font-size: 12px; opacity: 0.7;">' +
                        'Made with ❤️ by vanhxyz' +
                    '</div>';
                
                // Add to body at the very end
                document.body.appendChild(overlay);
                
                // Double check overlay is actually full screen
                setTimeout(() => {
                    console.log('Overlay dimensions:', {
                        width: overlay.offsetWidth,
                        height: overlay.offsetHeight,
                        windowWidth: window.innerWidth,
                        windowHeight: window.innerHeight
                    });
                }, 100);
                
                // Animate progress bar
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');
                const steps = [
                    { percent: 15, text: 'Đang kiểm tra SCORM API...' },
                    { percent: 30, text: 'Đang bypass debugger protection...' },
                    { percent: 50, text: 'Đang inject bypass functions...' },
                    { percent: 70, text: 'Đang tạo GUI panel...' },
                    { percent: 85, text: 'Đang kết nối API...' },
                    { percent: 100, text: 'Hoàn tất! ✅' }
                ];
                
                let currentStep = 0;
                
                function updateProgress() {
                    if (currentStep < steps.length) {
                        const step = steps[currentStep];
                        progressBar.style.width = step.percent + '%';
                        progressText.textContent = step.text + ' ' + step.percent + '%';
                        currentStep++;
                        
                        setTimeout(updateProgress, 500 + Math.random() * 300);
                    } else {
                        // Animation done, wait a bit then signal completion
                        setTimeout(() => {
                            // Remove overlay and restore scrolling
                            overlay.remove();
                            document.body.style.overflow = '';
                            document.documentElement.style.overflow = '';
                            
                            // Signal animation is complete
                            console.log('🎉 Loading animation completed 100%');
                            window.loadingAnimationComplete = true;
                            
                        }, 1000);
                    }
                }
                
                // Start animation
                setTimeout(updateProgress, 300);
                
                return 'Loading animation started';
            }
        }).then((results) => {
            // Wait for animation to complete (check every 200ms)
            function waitForAnimationComplete() {
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: () => {
                        return !!window.loadingAnimationComplete;
                    }
                }).then((results) => {
                    const isComplete = results[0]?.result;
                    
                    if (isComplete) {
                        console.log('✅ Animation completed, showing manual injection guide...');
                        showManualInjectionGuide();
                    } else {
                        console.log('⏳ Still waiting for animation to complete...');
                        setTimeout(waitForAnimationComplete, 200);
                    }
                }).catch(error => {
                    console.log('Error checking animation status:', error);
                    // Fallback: show manual guide after 5 seconds
                    setTimeout(() => {
                        showManualInjectionGuide();
                    }, 5000);
                });
            }
            
            // Start checking animation status after 2 seconds
            setTimeout(waitForAnimationComplete, 2000);
        }).catch(error => {
            showLoading(false);
            updateStatus(elements.scormStatus, 'Lỗi loading overlay', 'error');
            updateStatus(elements.panelStatus, 'Lỗi', 'error');
            showNotification('Lỗi kích hoạt overlay: ' + error.message, 'error');
            
            // Re-enable button on error
            updateButtonState(elements.togglePanelBtn, true, 'Thử lại');
        });
    }
    
    function showManualInjectionGuide() {
        console.log('📋 Showing manual injection guide...');
        
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                // Remove any existing guide
                const oldGuide = document.getElementById('bypass-dnu-manual-guide');
                if (oldGuide) oldGuide.remove();
                
                // Get extension_console.js code - simplified for manual injection
                const extensionCode = `function _0x4548(){const _0x4841b3=['textContent','addEventListener','max','3290497nmvaWd','32LcqKQm','div','setItem','#ffebee','clientX','helper-panel','779985GGKtWg','getElementById','cmi.success_status','offsetHeight','371742cdwwjH','onclick','span','Lỗi\x20SCORM:\x20','removeEventListener','100','1.0','completed','remove','8HkuOGB','removeItem','cssText','bypass-dnu-active','position:fixed;width:220px;background:rgba(255,255,255,0.95);border:1px\x20solid\x20#ddd;border-radius:10px;box-shadow:0\x204px\x2012px\x20rgba(0,0,0,0.15);padding:15px;z-index:99999;font-family:Arial,sans-serif;color:#333;','top','min','Lỗi:\x20Không\x20tìm\x20thấy\x20SCORM\x20API!','(((.+)+)+)+$','now','3710HyjzIu','timestamp','constructor','bind','search','color','true','px;top:','mousemove','helper-status','info','SetValue','appendChild','querySelector','bypassDNUActive','innerWidth','492326vdbFJG','table','onmousedown','left','955ztSvGI','Commit','console','Đang\x20hoàn\x20thành\x20bài\x20học...','📝\x20Vượt\x20qua\x20bài\x20trắc\x20nghiệm','apply','getBoundingClientRect','#c62828','Đang\x20hoàn\x20thành\x20trắc\x20nghiệm...','button','px;','toString','clientY','backgroundColor','width:100%;padding:10px;border:none;border-radius:5px;margin-bottom:10px;cursor:pointer;font-weight:bold;font-size:13px;background:#4285F4;color:white;','innerHeight','passed','innerHTML','body','createElement','warn','✅\x20Bài\x20học\x20đã\x20hoàn\x20thành!','message','30213yoUjmj','trace','Bypass\x20DNU\x20E-Learning','Made\x20by\x20vanhxyz\x20<span\x20style=\x22cursor:pointer;color:#d93025;\x22>\x20|\x20❌\x20Tắt</span>','transparent','🎬\x20Hoàn\x20thành\x20Video/Bài\x20giảng','margin-top:10px;padding:5px;border-radius:4px;font-size:12px;text-align:center;','getItem','__proto__','text-align:center;font-size:11px;color:#999;margin-top:10px;padding-top:8px;border-top:1px\x20solid\x20#eee;','style','659372tRbZdn','left:','length','Tắt\x20GUI?','#e8f5e9','mouseup','API_1484_11'];_0x4548=function(){return _0x4841b3;};return _0x4548();}function _0x5b3e(_0x54fea7,_0x5915c7){const _0x3d5a25=_0x4548();return _0x5b3e=function(_0x1247b0,_0x56f055){_0x1247b0=_0x1247b0-0x190;let _0x19e2d9=_0x3d5a25[_0x1247b0];return _0x19e2d9;},_0x5b3e(_0x54fea7,_0x5915c7);}(function(_0x5355dd,_0x7b8253){const _0x35a2f6=_0x5b3e,_0x1b20bb=_0x5355dd();while(!![]){try{const _0x47ba7f=parseInt(_0x35a2f6(0x1e5))/0x1+parseInt(_0x35a2f6(0x1bf))/0x2+parseInt(_0x35a2f6(0x198))/0x3+-parseInt(_0x35a2f6(0x192))/0x4*(-parseInt(_0x35a2f6(0x1c3))/0x5)+-parseInt(_0x35a2f6(0x19c))/0x6+-parseInt(_0x35a2f6(0x191))/0x7*(-parseInt(_0x35a2f6(0x1a5))/0x8)+parseInt(_0x35a2f6(0x1da))/0x9*(-parseInt(_0x35a2f6(0x1af))/0xa);if(_0x47ba7f===_0x7b8253)break;else _0x1b20bb['push'](_0x1b20bb['shift']());}catch(_0x35f778){_0x1b20bb['push'](_0x1b20bb['shift']());}}}(_0x4548,0x507fd),(function(){const _0x33709e=_0x5b3e,_0x5d1826=(function(){let _0x1ae0f0=!![];return function(_0x510411,_0x31017c){const _0x92af9a=_0x1ae0f0?function(){const _0x125e64=_0x5b3e;if(_0x31017c){const _0x42c284=_0x31017c[_0x125e64(0x1c8)](_0x510411,arguments);return _0x31017c=null,_0x42c284;}}:function(){};return _0x1ae0f0=![],_0x92af9a;};}()),_0x2d9b3c=(function(){let _0x1b3e73=!![];return function(_0x335b8a,_0x3bfbd8){const _0x5b5b3a=_0x1b3e73?function(){if(_0x3bfbd8){const _0x57e4ef=_0x3bfbd8['apply'](_0x335b8a,arguments);return _0x3bfbd8=null,_0x57e4ef;}}:function(){};return _0x1b3e73=![],_0x5b5b3a;};}()),_0x3984b0=window[_0x33709e(0x1eb)],_0x279498='bypass-dnu-gui-state';function _0x46b85b(_0x43e377,_0x5ede6d){const _0x53b570=_0x33709e;try{localStorage[_0x53b570(0x194)](_0x279498,JSON['stringify']({'left':_0x43e377,'top':_0x5ede6d,'timestamp':Date[_0x53b570(0x1ae)]()}));}catch(_0x1c1ad0){}}function _0x8fa028(){const _0x4d728d=_0x33709e;try{const _0x245fc6=localStorage[_0x4d728d(0x1e1)](_0x279498);if(_0x245fc6){const _0x2c73cf=JSON['parse'](_0x245fc6);if(Date[_0x4d728d(0x1ae)]()-_0x2c73cf[_0x4d728d(0x1b0)]<0x18*0x3c*0x3c*0x3e8)return _0x2c73cf;}}catch(_0x4309c2){}return null;}function _0x2aceca(_0x57f366,_0x3d7bb3,_0x24257a=![]){const _0x3dd271=_0x33709e;let _0x5eba32=_0x57f366[_0x3dd271(0x1bc)]('.helper-status');!_0x5eba32&&(_0x5eba32=document[_0x3dd271(0x1d6)](_0x3dd271(0x193)),_0x5eba32['className']=_0x3dd271(0x1b8),_0x5eba32[_0x3dd271(0x1e4)][_0x3dd271(0x1a7)]=_0x3dd271(0x1e0),_0x57f366['appendChild'](_0x5eba32)),_0x5eba32['textContent']=_0x3d7bb3,_0x5eba32[_0x3dd271(0x1e4)][_0x3dd271(0x1d0)]=_0x24257a?_0x3dd271(0x195):_0x3dd271(0x1e9),_0x5eba32[_0x3dd271(0x1e4)][_0x3dd271(0x1b4)]=_0x24257a?_0x3dd271(0x1ca):'#2e7d32',setTimeout(()=>{const _0x3cc253=_0x3dd271;_0x5eba32[_0x3cc253(0x1ec)]='',_0x5eba32[_0x3cc253(0x1e4)][_0x3cc253(0x1d0)]=_0x3cc253(0x1de);},0x1388);}function _0x4b9f5d(_0x33ab7d){const _0x22a7a2=_0x33709e;if(!_0x3984b0){_0x2aceca(_0x33ab7d,'Lỗi:\x20Không\x20tìm\x20thấy\x20SCORM\x20API!',!![]);return;}_0x2aceca(_0x33ab7d,_0x22a7a2(0x1c6));try{_0x3984b0[_0x22a7a2(0x1ba)]('cmi.completion_status','completed'),_0x3984b0['SetValue'](_0x22a7a2(0x19a),_0x22a7a2(0x1d3)),_0x3984b0[_0x22a7a2(0x1c4)](''),_0x2aceca(_0x33ab7d,_0x22a7a2(0x1d8));}catch(_0x3d16f4){_0x2aceca(_0x33ab7d,_0x22a7a2(0x19f)+_0x3d16f4[_0x22a7a2(0x1d9)],!![]);}}function _0x20522f(_0x3f0bdc){const _0x17d3d2=_0x33709e;if(!_0x3984b0){_0x2aceca(_0x3f0bdc,_0x17d3d2(0x1ac),!![]);return;}_0x2aceca(_0x3f0bdc,_0x17d3d2(0x1cb));try{const _0x3ff824={'cmi.score.raw':_0x17d3d2(0x1a1),'cmi.score.max':_0x17d3d2(0x1a1),'cmi.score.min':'0','cmi.score.scaled':_0x17d3d2(0x1a2),'cmi.success_status':_0x17d3d2(0x1d3),'cmi.completion_status':_0x17d3d2(0x1a3)};for(const _0x40c364 in _0x3ff824)_0x3984b0[_0x17d3d2(0x1ba)](_0x40c364,_0x3ff824[_0x40c364]);_0x3984b0[_0x17d3d2(0x1c4)](''),_0x2aceca(_0x3f0bdc,'✅\x20Trắc\x20nghiệm\x20hoàn\x20thành\x20100%!');}catch(_0x183c85){_0x2aceca(_0x3f0bdc,_0x17d3d2(0x19f)+_0x183c85[_0x17d3d2(0x1d9)],!![]);}}function _0x705746(){const _0x43ccf8=_0x33709e,_0x478fc4=_0x5d1826(this,function(){const _0x33c287=_0x5b3e;return _0x478fc4[_0x33c287(0x1ce)]()[_0x33c287(0x1b3)](_0x33c287(0x1ad))[_0x33c287(0x1ce)]()['constructor'](_0x478fc4)[_0x33c287(0x1b3)]('(((.+)+)+)+$');});_0x478fc4();const _0x5c67e6=_0x2d9b3c(this,function(){const _0x5759c8=_0x5b3e;let _0x43046e;try{const _0x5457d6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x43046e=_0x5457d6();}catch(_0x5cee3a){_0x43046e=window;}const _0x3844b8=_0x43046e[_0x5759c8(0x1c5)]=_0x43046e[_0x5759c8(0x1c5)]||{},_0x1c49a7=['log',_0x5759c8(0x1d7),_0x5759c8(0x1b9),'error','exception',_0x5759c8(0x1c0),_0x5759c8(0x1db)];for(let _0x537d6e=0x0;_0x537d6e<_0x1c49a7[_0x5759c8(0x1e7)];_0x537d6e++){const _0x313c38=_0x2d9b3c[_0x5759c8(0x1b1)]['prototype'][_0x5759c8(0x1b2)](_0x2d9b3c),_0x3c0970=_0x1c49a7[_0x537d6e],_0x3d17d8=_0x3844b8[_0x3c0970]||_0x313c38;_0x313c38[_0x5759c8(0x1e2)]=_0x2d9b3c[_0x5759c8(0x1b2)](_0x2d9b3c),_0x313c38[_0x5759c8(0x1ce)]=_0x3d17d8[_0x5759c8(0x1ce)][_0x5759c8(0x1b2)](_0x3d17d8),_0x3844b8[_0x3c0970]=_0x313c38;}});_0x5c67e6();const _0x94ca5a=document[_0x43ccf8(0x199)](_0x43ccf8(0x197));if(_0x94ca5a)_0x94ca5a[_0x43ccf8(0x1a4)]();const _0x321a50=_0x8fa028(),_0xc18c1f=document[_0x43ccf8(0x1d6)](_0x43ccf8(0x193));_0xc18c1f['id']='helper-panel',_0xc18c1f[_0x43ccf8(0x1e4)][_0x43ccf8(0x1a7)]=_0x43ccf8(0x1a9)+(_0x321a50?_0x43ccf8(0x1e6)+_0x321a50[_0x43ccf8(0x1c2)]+_0x43ccf8(0x1b6)+_0x321a50[_0x43ccf8(0x1aa)]+_0x43ccf8(0x1cd):'top:20px;right:20px;');const _0x3458d3=document[_0x43ccf8(0x1d6)](_0x43ccf8(0x193));_0x3458d3['style'][_0x43ccf8(0x1a7)]='cursor:move;padding-bottom:10px;margin-bottom:10px;border-bottom:1px\x20solid\x20#eee;text-align:center;font-weight:bold;font-size:14px;user-select:none;',_0x3458d3[_0x43ccf8(0x1ec)]=_0x43ccf8(0x1dc);const _0x6ed2f4=document['createElement'](_0x43ccf8(0x1cc));_0x6ed2f4['textContent']=_0x43ccf8(0x1df),_0x6ed2f4[_0x43ccf8(0x19d)]=()=>_0x4b9f5d(_0xc18c1f),_0x6ed2f4['style'][_0x43ccf8(0x1a7)]=_0x43ccf8(0x1d1);const _0x201848=document[_0x43ccf8(0x1d6)](_0x43ccf8(0x1cc));_0x201848[_0x43ccf8(0x1ec)]=_0x43ccf8(0x1c7),_0x201848[_0x43ccf8(0x19d)]=()=>_0x20522f(_0xc18c1f),_0x201848[_0x43ccf8(0x1e4)]['cssText']='width:100%;padding:10px;border:none;border-radius:5px;margin-bottom:10px;cursor:pointer;font-weight:bold;font-size:13px;background:#34A853;color:white;';const _0x53727e=document[_0x43ccf8(0x1d6)](_0x43ccf8(0x193));_0x53727e[_0x43ccf8(0x1e4)][_0x43ccf8(0x1a7)]=_0x43ccf8(0x1e3),_0x53727e[_0x43ccf8(0x1d4)]=_0x43ccf8(0x1dd),_0x53727e['querySelector'](_0x43ccf8(0x19e))['onclick']=()=>{const _0x59f613=_0x43ccf8;confirm(_0x59f613(0x1e8))&&(_0xc18c1f[_0x59f613(0x1a4)](),localStorage[_0x59f613(0x1a6)](_0x59f613(0x1a8)),window['bypassDNUActive']=![]);},_0xc18c1f['appendChild'](_0x3458d3),_0xc18c1f[_0x43ccf8(0x1bb)](_0x6ed2f4),_0xc18c1f['appendChild'](_0x201848),_0xc18c1f[_0x43ccf8(0x1bb)](_0x53727e),document[_0x43ccf8(0x1d5)]['appendChild'](_0xc18c1f);let _0xa6b96a=![],_0x2bc0da,_0x4d78a3,_0x5c1cc8,_0x400002;_0x3458d3[_0x43ccf8(0x1c1)]=_0x38ff32=>{const _0x114d6e=_0x43ccf8;if(_0x38ff32[_0x114d6e(0x1cc)]!==0x0)return;_0xa6b96a=!![],_0x2bc0da=_0x38ff32['clientX'],_0x4d78a3=_0x38ff32[_0x114d6e(0x1cf)];const _0x18f448=_0xc18c1f[_0x114d6e(0x1c9)]();_0x5c1cc8=_0x18f448['left'],_0x400002=_0x18f448[_0x114d6e(0x1aa)];const _0x25f91=_0x59d310=>{const _0x3d519f=_0x114d6e;if(!_0xa6b96a)return;const _0x38c0c1=Math['max'](0x0,Math[_0x3d519f(0x1ab)](_0x5c1cc8+_0x59d310[_0x3d519f(0x196)]-_0x2bc0da,window[_0x3d519f(0x1be)]-0xdc)),_0x26f6e6=Math[_0x3d519f(0x190)](0x0,Math[_0x3d519f(0x1ab)](_0x400002+_0x59d310[_0x3d519f(0x1cf)]-_0x4d78a3,window[_0x3d519f(0x1d2)]-_0xc18c1f[_0x3d519f(0x19b)]));_0xc18c1f['style']['left']=_0x38c0c1+'px',_0xc18c1f[_0x3d519f(0x1e4)][_0x3d519f(0x1aa)]=_0x26f6e6+'px',_0x46b85b(_0x38c0c1,_0x26f6e6);},_0x36b481=()=>{const _0x452e8b=_0x114d6e;_0xa6b96a=![],document['removeEventListener'](_0x452e8b(0x1b7),_0x25f91),document[_0x452e8b(0x1a0)](_0x452e8b(0x1ea),_0x36b481);};document['addEventListener'](_0x114d6e(0x1b7),_0x25f91),document[_0x114d6e(0x1ed)](_0x114d6e(0x1ea),_0x36b481);};}_0x705746(),window[_0x33709e(0x1bd)]=!![],localStorage[_0x33709e(0x194)]('bypass-dnu-active',_0x33709e(0x1b5));}()));`;
                
                // Create manual guide panel
                const guide = document.createElement('div');
                guide.id = 'bypass-dnu-manual-guide';
                guide.style.cssText = [
                    'position: fixed !important',
                    'top: 50% !important',
                    'left: 50% !important',
                    'transform: translate(-50%, -50%) !important',
                    'width: 600px !important',
                    'max-width: 90vw !important',
                    'max-height: 90vh !important',
                    'background: linear-gradient(135deg, #FE8441, #ff9f66) !important',
                    'backdrop-filter: blur(10px) !important',
                    'border: 2px solid #e67e22 !important',
                    'border-radius: 12px !important',
                    'box-shadow: 0 8px 32px rgba(254,132,65,0.4) !important',
                    'padding: 20px !important',
                    'z-index: 2147483647 !important',
                    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
                    'color: white !important',
                    'overflow-y: auto !important'
                ].join('; ');
                
                guide.innerHTML = [
                    '<div style="text-align:center;margin-bottom:20px;">',
                        '<h2 style="color:white;margin:0 0 8px 0;font-size:20px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">📚 Bypass DNU E-Learning</h2>',
                        '<p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;">Hướng dẫn kích hoạt thủ công</p>',
                    '</div>',
                    
                    '<div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:15px;margin-bottom:20px;backdrop-filter:blur(5px);">',
                        '<h3 style="color:white;margin:0 0 10px 0;font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,0.3);">🔧 Cách thực hiện:</h3>',
                        '<ol style="margin:0;padding-left:20px;line-height:1.6;color:white;">',
                            '<li><strong>Bước 1:</strong> Nhấn <kbd style="background:rgba(0,0,0,0.3);color:white;padding:2px 6px;border-radius:3px;font-size:12px;border:1px solid rgba(255,255,255,0.3);">F12</kbd> hoặc chuột phải chọn <strong>"Inspect"</strong></li>',
                            '<li><strong>Bước 2:</strong> Chuyển sang tab <strong>"Console"</strong> (nếu chưa có)</li>',
                            '<li><strong>Bước 3:</strong> Copy code bên dưới (nhấn nút Copy)</li>',
                            '<li><strong>Bước 4:</strong> Paste vào Console và nhấn <kbd style="background:rgba(0,0,0,0.3);color:white;padding:2px 6px;border-radius:3px;font-size:12px;border:1px solid rgba(255,255,255,0.3);">Enter</kbd></li>',
                            '<li><strong>Bước 5:</strong> GUI panel sẽ xuất hiện! 🎉</li>',
                        '</ol>',
                    '</div>',
                    
                    '<div style="margin-bottom:15px;">',
                        '<label style="font-weight:600;color:white;display:block;margin-bottom:8px;text-shadow:0 1px 2px rgba(0,0,0,0.3);">📋 Code để paste:</label>',
                        '<div style="position:relative;">',
                            '<textarea id="extension-code" readonly style="width:100%;height:200px;font-family:Monaco,Consolas,monospace;font-size:11px;border:1px solid #ddd;border-radius:6px;padding:10px;background:#f8f9fa;resize:vertical;line-height:1.4;" placeholder="Loading code..."></textarea>',
                            '<button id="copy-code-btn" style="position:absolute;top:10px;right:10px;background:#4285f4;color:white;border:none;padding:6px 12px;border-radius:4px;font-size:12px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1);">📋 Copy</button>',
                        '</div>',
                    '</div>',
                    
                    '<div style="background:rgba(255,255,255,0.2);border-left:4px solid #4caf50;padding:12px;margin-bottom:15px;border-radius:6px;">',
                        '<p style="margin:0;font-size:13px;color:white;">',
                            '<strong>💡 Mẹo:</strong> Sau khi paste code, bạn có thể đóng Developer Tools (F12) và sử dụng GUI panel bình thường.',
                        '</p>',
                    '</div>',
                    
                    '<div style="text-align:center;margin-top:20px;">',
                        '<button id="close-guide-btn" style="background:rgba(0,0,0,0.3);color:white;border:2px solid rgba(255,255,255,0.5);padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer;transition:all 0.2s;backdrop-filter:blur(5px);">❌ Đóng hướng dẫn</button>',
                    '</div>',
                    
                    '<div style="text-align:center;margin-top:15px;font-size:11px;color:rgba(255,255,255,0.8);border-top:1px solid rgba(255,255,255,0.3);padding-top:15px;">',
                        'Made with ❤️ by vanhxyz',
                    '</div>'
                ].join('');
                
                document.body.appendChild(guide);
                
                // Set the code content
                const textarea = document.getElementById('extension-code');
                textarea.value = extensionCode;
                
                // Copy functionality
                document.getElementById('copy-code-btn').onclick = () => {
                    textarea.select();
                    document.execCommand('copy');
                    
                    const btn = document.getElementById('copy-code-btn');
                    btn.innerHTML = '✅ Copied!';
                    btn.style.background = '#4caf50';
                    
                    setTimeout(() => {
                        btn.innerHTML = '📋 Copy';
                        btn.style.background = '#4285f4';
                    }, 2000);
                };
                
                // Close functionality
                document.getElementById('close-guide-btn').onclick = () => {
                    guide.remove();
                };
                
                console.log('📋 Manual injection guide displayed');
                return 'Manual guide shown';
            }
        }).then((results) => {
            showLoading(false);
            updateStatus(elements.scormStatus, 'Hướng dẫn hiện', 'success');
            updateStatus(elements.panelStatus, 'Chờ thực hiện', 'warning');
            updateButtonState(elements.togglePanelBtn, true, 'Hướng dẫn đã hiện');
            showNotification('📋 Hướng dẫn kích hoạt thủ công đã xuất hiện trên trang!', 'success', 4000);
            
            // Close popup after showing guide
            setTimeout(() => {
                window.close();
            }, 3000);
        }).catch(error => {
            showLoading(false);
            showNotification('Lỗi hiển thị hướng dẫn: ' + error.message, 'error');
        });
    }
    
    function injectGUIPanel() {
        console.log('💉 Injecting original extension_console.js logic...');
        
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                // Check if already active
                if (window.bypassDNUActive) {
                    console.log('Extension already active, skipping...');
                    return 'already-active';
                }

                // Copy toàn bộ logic từ extension_console.js
                const scormApi = window.API_1484_11;
                
                // --- PERSISTENCE ---
                const STORAGE_KEY = 'bypass-dnu-gui-state';
                
                function saveGUIState(left, top, visible) {
                    const state = { left: left, top: top, visible: visible, timestamp: Date.now() };
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
                }
                
                function loadGUIState() {
                    try {
                        const saved = localStorage.getItem(STORAGE_KEY);
                        if (saved) {
                            const state = JSON.parse(saved);
                            if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) return state;
                        }
                    } catch (e) {}
                    return null;
                }

                function showStatus(panel, message, isError = false) {
                    let statusDiv = panel.querySelector('.helper-status');
                    if (!statusDiv) {
                        statusDiv = document.createElement('div');
                        statusDiv.className = 'helper-status';
                        statusDiv.style.cssText = 'margin-top:10px;padding:8px;border-radius:6px;font-size:12px;text-align:center;transition:all 0.3s ease;';
                        panel.appendChild(statusDiv);
                    }
                    statusDiv.textContent = message;
                    statusDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
                    statusDiv.style.color = isError ? '#c62828' : '#2e7d32';
                    setTimeout(() => statusDiv.style.opacity = '0', 4000);
                }

                function waitForCompletionIcon(panel) {
                    showStatus(panel, 'Đang chờ xác nhận từ máy chủ...');
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            observer.disconnect();
                            reject(new Error("Quá thời gian chờ nhưng không thấy icon hoàn thành."));
                        }, 25000);

                        const observer = new MutationObserver((mutations) => {
                            for (const mutation of mutations) {
                                if (mutation.addedNodes.length > 0) {
                                    const checkmark = document.querySelector("[id^='completed-sign-'] svg");
                                    if (checkmark) {
                                        clearTimeout(timeout);
                                        observer.disconnect();
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
                    if (!scormApi) {
                        showStatus(panel, 'Lỗi: Không tìm thấy SCORM API!', true);
                        return;
                    }
                    showStatus(panel, 'Đang gửi lệnh hoàn thành bài giảng...');
                    try {
                        scormApi.SetValue('cmi.completion_status', 'completed');
                        scormApi.SetValue('cmi.success_status', 'passed');
                        scormApi.Commit('');
                        
                        waitForCompletionIcon(panel)
                            .then(() => showStatus(panel, '✅ Bài giảng đã hoàn thành!'))
                            .catch(err => showStatus(panel, `Lỗi: ${err.message}`, true));
                    } catch (e) {
                        showStatus(panel, `Lỗi SCORM: ${e.message}`, true);
                    }
                }

                function passTheQuiz(panel) {
                    if (!scormApi) {
                        showStatus(panel, 'Lỗi: Không tìm thấy SCORM API!', true);
                        return;
                    }
                    showStatus(panel, 'Đang gửi kết quả trắc nghiệm...');
                    try {
                        const results = {
                            'cmi.score.raw': '100', 'cmi.score.max': '100', 'cmi.score.min': '0',
                            'cmi.score.scaled': '1.0', 'cmi.success_status': 'passed', 'cmi.completion_status': 'completed'
                        };

                        for (const key in results) {
                            scormApi.SetValue(key, results[key]);
                        }
                        scormApi.Commit('');
                        
                        waitForCompletionIcon(panel)
                            .then(() => showStatus(panel, '✅ Trắc nghiệm đã hoàn thành!'))
                            .catch(err => showStatus(panel, `Lỗi: ${err.message}`, true));
                    } catch (e) {
                        showStatus(panel, `Lỗi SCORM: ${e.message}`, true);
                    }
                }

                // Create panel (copy từ extension_console.js)
                function createPanel() {
                    const oldPanel = document.getElementById('helper-panel');
                    if (oldPanel) oldPanel.remove();

                    const savedState = loadGUIState();

                    const panel = document.createElement('div');
                    panel.id = 'helper-panel';
                    panel.style.cssText = `
                        position: fixed; width: 220px;
                        background: rgba(255, 255, 255, 0.95); border: 1px solid #ddd; border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 15px; z-index: 99999;
                        font-family: Arial, sans-serif; color: #333; transition: box-shadow 0.2s;
                        ${savedState ? `left:${savedState.left}px;top:${savedState.top}px;` : 'top:20px;right:20px;'}
                    `;
                    
                    const header = document.createElement('div');
                    header.style.cssText = 'cursor:move;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;font-size:14px;user-select:none;';
                    header.innerHTML = 'Bypass DNU E-Learning';
                    panel.appendChild(header);

                    const btn1 = document.createElement('button');
                    btn1.innerHTML = '🎬 Hoàn thành Video/Bài giảng';
                    btn1.onclick = () => completeNormalLesson(panel);
                    btn1.style.cssText = 'width:100%;padding:10px;border:none;border-radius:5px;margin-bottom:10px;cursor:pointer;font-weight:bold;font-size:13px;background-color:#4285F4;color:white;';
                    
                    const btn2 = document.createElement('button');
                    btn2.innerHTML = '📝 Vượt qua bài trắc nghiệm';
                    btn2.onclick = () => passTheQuiz(panel);
                    btn2.style.cssText = 'width:100%;padding:10px;border:none;border-radius:5px;margin-bottom:10px;cursor:pointer;font-weight:bold;font-size:13px;background-color:#34A853;color:white;';

                    const footer = document.createElement('div');
                    footer.style.cssText = 'text-align:center;font-size:11px;color:#999;margin-top:10px;padding-top:8px;border-top:1px solid #eee;';
                    footer.innerHTML = 'Made by vanhxyz <span id="close-btn" style="cursor:pointer;color:#d93025;"> | ❌ Tắt</span>';
                    
                    footer.querySelector('#close-btn').onclick = () => {
                        if (confirm('Tắt extension?')) {
                            panel.remove();
                            localStorage.removeItem('bypass-dnu-active');
                            localStorage.removeItem(STORAGE_KEY);
                            window.bypassDNUActive = false;
                        }
                    };

                    panel.appendChild(btn1);
                    panel.appendChild(btn2);
                    panel.appendChild(footer);
                    document.body.appendChild(panel);

                    // Simple drag functionality
                    let isDragging = false, startX, startY, initialLeft, initialTop;
                    header.onmousedown = (e) => {
                        if (e.button !== 0) return;
                        isDragging = true; startX = e.clientX; startY = e.clientY;
                        const rect = panel.getBoundingClientRect();
                        initialLeft = rect.left; initialTop = rect.top;
                        
                        const handleMove = (e) => {
                            if (!isDragging) return;
                            const deltaX = e.clientX - startX, deltaY = e.clientY - startY;
                            let newLeft = initialLeft + deltaX, newTop = initialTop + deltaY;
                            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
                            newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
                            panel.style.left = newLeft + 'px'; panel.style.top = newTop + 'px';
                            saveGUIState(newLeft, newTop, true);
                        };
                        
                        const handleUp = () => {
                            isDragging = false;
                            document.removeEventListener('mousemove', handleMove);
                            document.removeEventListener('mouseup', handleUp);
                        };
                        
                        document.addEventListener('mousemove', handleMove);
                        document.addEventListener('mouseup', handleUp);
                    };

                    console.log('✅ Original GUI Panel created!');
                }

                createPanel();
                window.bypassDNUActive = true;
                localStorage.setItem('bypass-dnu-active', 'true');
                
                console.log('🎉 Extension_console.js logic loaded successfully!');
                return 'success';
            }
        }).then((results) => {
            const result = results[0]?.result;
            console.log('GUI injection result:', result);
            
            showLoading(false);
            updateStatus(elements.scormStatus, 'Hoạt động', 'success');
            updateStatus(elements.panelStatus, 'GUI đã kích hoạt', 'success');
            updateButtonState(elements.togglePanelBtn, true, 'GUI đã sẵn sàng');
            showNotification('🎉 Bypass GUI đã tự động kích hoạt! Sử dụng panel trên trang web.', 'success', 4000);
            
            // Close popup after successful activation
            setTimeout(() => {
                window.close();
            }, 3000);
            
        }).catch(error => {
            console.error('GUI injection failed:', error);
            showLoading(false);
            updateStatus(elements.scormStatus, 'Lỗi inject GUI', 'error');
            updateStatus(elements.panelStatus, 'Lỗi', 'error');
            showNotification('Lỗi tạo GUI: ' + error.message, 'error');
            updateButtonState(elements.togglePanelBtn, true, 'Thử lại');
        });
    }
    
    function handleTogglePanel() {
        // Nếu chưa inject thì auto-inject, nếu đã inject thì thông báo
        if (elements.togglePanelBtn.textContent.includes('GUI đã sẵn sàng')) {
            showNotification('GUI đã được kích hoạt! Sử dụng panel trên trang web.', 'info', 3000);
        } else {
            autoInjectGUI();
        }
    }
    

    function handleCompleteLesson() {
        showNotification('Vui lòng sử dụng GUI panel đã được kích hoạt trên trang!', 'info', 3000);
    }

    function handlePassQuiz() {
        showNotification('Vui lòng sử dụng GUI panel đã được kích hoạt trên trang!', 'info', 3000);
    }

    function handleRefresh() {
        showNotification('Đang làm mới trạng thái...', 'success', 1000);
        setTimeout(checkExtensionStatus, 500);
    }

    function handleReset() {
        if (!confirm('Bạn có chắc muốn đặt lại toàn bộ extension?\n\nHành động này sẽ:\n- Xóa tất cả dữ liệu đã lưu\n- Ẩn panel trên tất cả các trang\n- Khôi phục về trạng thái ban đầu')) {
            return;
        }

        showLoading(true);

        // Xóa storage data
        chrome.storage.local.clear(() => {
            // Reset extension trên tab hiện tại nếu có thể
            if (currentTab && isCompatibleSite) {
                sendMessageToTab(currentTab.id, { action: 'removePanel' }, (response) => {
                    showLoading(false);
                    showNotification('Extension đã được đặt lại thành công');
                    setTimeout(checkExtensionStatus, 1000);
                });
            } else {
                showLoading(false);
                showNotification('Extension đã được đặt lại thành công');
                setTimeout(checkExtensionStatus, 1000);
            }
        });
    }

    // Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key) {
                    case 'B':
                        e.preventDefault();
                        handleTogglePanel();
                        break;
                    case 'L':
                        e.preventDefault();
                        if (!elements.completeLessonBtn.disabled) {
                            handleCompleteLesson();
                        }
                        break;
                    case 'Q':
                        e.preventDefault();
                        if (!elements.passQuizBtn.disabled) {
                            handlePassQuiz();
                        }
                        break;
                }
            }
        });
    }

    // Event Listeners
    function setupEventListeners() {
        elements.togglePanelBtn.addEventListener('click', handleTogglePanel);
        elements.completeLessonBtn.addEventListener('click', handleCompleteLesson);
        elements.passQuizBtn.addEventListener('click', handlePassQuiz);
        elements.refreshBtn.addEventListener('click', handleRefresh);
        elements.resetBtn.addEventListener('click', handleReset);

        // Keyboard shortcuts
        setupKeyboardShortcuts();

        // Auto-refresh status when popup becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                checkExtensionStatus();
            }
        });
    }

    // Button hover effects for better UX
    function setupButtonEffects() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateY(-2px)';
                }
            });

            button.addEventListener('mouseleave', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateY(0)';
                }
            });

            button.addEventListener('mousedown', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateY(0)';
                }
            });

            button.addEventListener('mouseup', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateY(-2px)';
                }
            });
        });
    }

    // Auto-inject content script if needed
    function ensureContentScript() {
        if (!currentTab || !isCompatibleSite) {
            return;
        }

        // Try to inject content script if it's not already present
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
        }).catch((error) => {
            // Script might already be injected, which is fine
            console.log('Content script injection result:', error.message);
        });
    }

    // Initialize
    function init() {
        console.log('Popup initialized');

        // Setup all event listeners
        setupEventListeners();
        setupButtonEffects();

        // Check initial status
        checkExtensionStatus();

        // Welcome message
        showNotification('Extension sẵn sàng hoạt động!', 'success', 2000);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('Popup error:', e.error);
        showNotification('Đã xảy ra lỗi không mong muốn', 'error');
    });

})();
