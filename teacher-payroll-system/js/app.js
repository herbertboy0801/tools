// 主要应用逻辑

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const navSettings = document.getElementById('nav-settings');
    const navSchedule = document.getElementById('nav-schedule');
    const navPayroll = document.getElementById('nav-payroll');

    if (navSettings) {
        navSettings.addEventListener('click', () => showSection('settings'));
    } else {
        console.error("nav-settings button not found");
    }

    if (navSchedule) {
        navSchedule.addEventListener('click', () => showSection('schedule'));
    } else {
        console.error("nav-schedule button not found");
    }

    if (navPayroll) {
        navPayroll.addEventListener('click', () => showSection('payroll'));
    } else {
        console.error("nav-payroll button not found");
    }

    renderInitialUI();
});

function renderInitialUI() {
    // 默认显示系统设置部分
    showSection('settings');
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
        activeSection.style.display = 'block';
        // 根据sectionId调用相应的初始化函数
        switch (sectionId) {
            case 'settings':
                if (typeof initSettingsUI === 'function') {
                    initSettingsUI();
                } else {
                    console.error('initSettingsUI is not defined');
                }
                break;
            case 'schedule':
                if (typeof initScheduleUI === 'function') {
                    initScheduleUI();
                } else {
                    console.error('initScheduleUI is not defined');
                }
                break;
            case 'payroll':
                if (typeof initPayrollUI === 'function') {
                    initPayrollUI();
                } else {
                    console.error('initPayrollUI is not defined');
                }
                break;
            default:
                console.warn(`No specific UI initialization for section: ${sectionId}`);
        }
    } else {
        console.error(`Section with id "${sectionId}-section" not found.`);
    }
}