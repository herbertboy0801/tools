// 数据处理 (与localStorage交互)
console.log("Data module loaded");

const STORAGE_KEYS = {
    TEACHERS: 'payroll_teachers',
    TIMESLOT_TYPES: 'payroll_timeslot_types',
    SCHEDULE_TEMPLATES: 'payroll_schedule_templates',
    MONTHLY_SCHEDULES: 'payroll_monthly_schedules',
    LEAVE_RECORDS: 'payroll_leave_records',
    PAYSLIPS: 'payroll_payslips'
};

/**
 * 从localStorage获取数据
 * @param {string} key - 存储键名 (使用 STORAGE_KEYS)
 * @param {any} [defaultValue=null] - 如果获取失败或无数据时返回的默认值
 * @returns {any} 解析后的数据，如果不存在或解析失败则返回 defaultValue
 */
function getData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        // 如果数据是 null 或 undefined，返回默认值
        if (data === null || data === undefined) {
            return defaultValue;
        }
        // 尝试解析，如果解析出 null 或 undefined（不太可能但以防万一），也返回默认值
        const parsedData = JSON.parse(data);
        return (parsedData === null || parsedData === undefined) ? defaultValue : parsedData;
    } catch (error) {
        console.error(`Error getting data for key ${key}:`, error);
        // 发生错误时也返回默认值
        return defaultValue;
    }
}

/**
 * 将数据存入localStorage
 * @param {string} key - 存储键名 (使用 STORAGE_KEYS)
 * @param {any} value - 要存储的数据
 */
function saveData(key, value) {
    try {
        // 确保不存储 undefined
        if (value === undefined) {
            console.warn(`Attempted to save undefined for key ${key}. Saving null instead.`);
            value = null;
        }
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving data for key ${key}:`, error);
        // 可以考虑更健壮的错误处理，例如通知用户存储失败
    }
}

/**
 * 生成一个简单的唯一ID (用于示例)
 * @param {string} prefix - ID前缀 (e.g., 'T' for teacher, 'TS' for timeslot)
 * @returns {string}
 */
function generateId(prefix = 'ID') {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}


// 初始化默认数据（如果需要）
function initializeDefaultData() {
    // 初始化时段类型 (根据Excel表头更新)
    if (getData(STORAGE_KEYS.TIMESLOT_TYPES, null) === null) {
        const defaultTimeSlotTypes = [
            { id: generateId('TS'), name: '早自修', defaultDuration: 40, multiplier: 1.0 }, // 0750-0830
            { id: generateId('TS'), name: '第1节', defaultDuration: 40, multiplier: 1.0 }, // 0840-0920
            { id: generateId('TS'), name: '第2节', defaultDuration: 40, multiplier: 1.0 }, // 0930-1010
            { id: generateId('TS'), name: '第3节', defaultDuration: 40, multiplier: 1.0 }, // 1030-1110
            { id: generateId('TS'), name: '第4节', defaultDuration: 40, multiplier: 1.0 }, // 1120-1200
            { id: generateId('TS'), name: '午餐', defaultDuration: 30, multiplier: 0.0 }, // 1200-1230 (不计薪)
            { id: generateId('TS'), name: '午休', defaultDuration: 50, multiplier: 0.0 }, // 1230-1320 (不计薪)
            { id: generateId('TS'), name: '第5节', defaultDuration: 40, multiplier: 1.0 }, // 1330-1410
            { id: generateId('TS'), name: '第6节', defaultDuration: 40, multiplier: 1.0 }, // 1420-1500
            { id: generateId('TS'), name: '打掃時間', defaultDuration: 20, multiplier: 1.0 }, // 1500-1520 (假设计薪)
            { id: generateId('TS'), name: '第7节', defaultDuration: 40, multiplier: 1.0 }, // 1520-1600
            // 保留之前定义的特殊时段示例，您可以按需修改或添加更多
            { id: generateId('TS'), name: '周末/晚间特殊', defaultDuration: 60, multiplier: 2.0 } // 示例双倍时段
        ];
        saveData(STORAGE_KEYS.TIMESLOT_TYPES, defaultTimeSlotTypes);
        console.log("Initialized default time slot types based on Excel header.");
    }

    // 初始化教师列表 (根据Excel底部标签页添加)
    // 默认时薪暂时都设为190，请在系统中单独调整
    if (getData(STORAGE_KEYS.TEACHERS, null) === null) {
        const defaultTeachers = [
            { id: generateId('T'), name: '商東貞', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '何慕嫻', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '王秋琳', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '黃美應', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '朱雨婕', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '吳宜珍', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '徐文菁', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '陳採琴', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '林蔡秀韻', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '黃芳玲', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '陳娟瑜', defaultHourlyRate: 190, weeklyDefaultSchedule: {} },
            { id: generateId('T'), name: '鄒林碧蓮', defaultHourlyRate: 190, weeklyDefaultSchedule: {} }
        ];
        saveData(STORAGE_KEYS.TEACHERS, defaultTeachers);
        console.log("Initialized default teachers based on Excel tabs.");
    }

     // 初始化其他数据存储 (确保为空数组或合适默认值)
     if (getData(STORAGE_KEYS.SCHEDULE_TEMPLATES, null) === null) {
        saveData(STORAGE_KEYS.SCHEDULE_TEMPLATES, []);
         console.log("Initialized empty schedule templates list.");
    }
     // 月度排班数据结构: {'YYYY-MM': [{'teacherId': string, 'day': number, 'timeSlotId': string}, ...]}
     if (getData(STORAGE_KEYS.MONTHLY_SCHEDULES, null) === null) {
        saveData(STORAGE_KEYS.MONTHLY_SCHEDULES, {}); // 仍然用对象存储月份，但值是数组
        console.log("Initialized empty monthly schedules object (new structure).");
    }
     if (getData(STORAGE_KEYS.LEAVE_RECORDS, null) === null) {
        saveData(STORAGE_KEYS.LEAVE_RECORDS, []);
        console.log("Initialized empty leave records list.");
   }
    // 薪资单数据结构: {'YYYY-MM': { 'teacherId': { calculatedSalary, adjustment, notes, finalSalary, status }, ... }}
    if (getData(STORAGE_KEYS.PAYSLIPS, null) === null) {
       saveData(STORAGE_KEYS.PAYSLIPS, {}); // 键为 YYYY-MM，值为 { teacherId: payslipDetails } 的对象
       console.log("Initialized empty payslips object (new structure).");
   }
}

// 应用启动时初始化数据
initializeDefaultData();