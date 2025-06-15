// UI界面更新逻辑
console.log("UI module loaded");

/**
 * 初始化系统设置模块的UI界面
 */
function initSettingsUI() {
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
        settingsSection.innerHTML = `
            <h3>系统设置</h3>
            <div id="timeslot-settings">
                <h4>课程/时段定义</h4>
                <button onclick="toggleEditor('timeslot-editor')">管理时段</button>
                <div id="timeslot-list" style="margin-top: 10px;"></div>
                <div id="timeslot-editor" class="editor-section"></div>
            </div>
            <div id="teacher-settings" style="margin-top: 20px;">
                <h4>教师管理</h4>
                 <button onclick="toggleEditor('teacher-editor')">管理教师</button>
                 <div id="teacher-list" style="margin-top: 10px;"></div>
                 <div id="teacher-editor" class="editor-section"></div>
            </div>
            <div id="template-settings" style="margin-top: 20px;">
               <h4>排班模板管理</h4>
                <button onclick="toggleEditor('template-editor')">管理模板</button>
                <div id="template-list" style="margin-top: 10px;"></div>
                <div id="template-editor" class="editor-section"></div>
           </div>
            <div id="calendar-settings" style="margin-top: 20px;">
                <h4>日历设置 (待开发)</h4>
                 <button disabled>管理日历</button>
                 <div id="calendar-view" style="margin-top: 10px;"></div>
            </div>
        `;
        // 初始加载列表
        renderTimeSlotList();
        renderTeacherList();
        renderTemplateList(); // 启用模板列表渲染
        renderLeaveRecordList(); // 启用请假记录列表渲染
        // renderCalendarView(); // 待开发
    } else {
        console.error("Settings section not found!");
    }
}

/**
 * 切换编辑器的显示/隐藏状态
 * @param {string} editorId - 编辑器元素的ID
 */
function toggleEditor(editorId) {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    if (editor.style.display === 'none' || editor.style.display === '') {
        // 如果是隐藏的，则显示并渲染内容
        if (editorId === 'timeslot-editor') {
            renderTimeSlotEditorContent();
        } else if (editorId === 'teacher-editor') {
            renderTeacherEditorContent();
        } else if (editorId === 'template-editor') {
            renderTemplateEditorContent();
        } else if (editorId === 'leave-editor') {
            renderLeaveRecordEditorContent();
        }
        editor.style.display = 'block';
    } else {
        // 如果是显示的，则隐藏
        editor.style.display = 'none';
    }
}


// --- 时段管理 UI ---

/**
 * 渲染时段列表
 */
function renderTimeSlotList() {
    const listContainer = document.getElementById('timeslot-list');
    // 从 data.js 获取数据，提供空数组作为默认值
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    if (!listContainer) return;

    if (timeSlots.length === 0) {
        listContainer.innerHTML = '<p>暂无时段信息，请点击“管理时段”添加。</p>';
        return;
    }

    let html = '<ul>';
    timeSlots.forEach(slot => {
        html += `<li>${slot.name} (时长: ${slot.defaultDuration}分钟, 薪资乘数: ${slot.multiplier})</li>`;
    });
    html += '</ul>';
    listContainer.innerHTML = html;
}

/**
 * 渲染时段编辑器内容 (编辑器已显示时调用)
 */
function renderTimeSlotEditorContent() {
    const editor = document.getElementById('timeslot-editor');
    if (!editor) return;

    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    let editorHtml = `
        <h5>编辑时段信息</h5>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>默认时长(分钟)</th>
                    <th>薪资乘数</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;
    if (timeSlots.length > 0) {
        timeSlots.forEach((slot, index) => {
            editorHtml += `
                <tr>
                    <td><input type="text" value="${slot.id}" id="ts-id-${index}" disabled style="background-color: #eee;"></td>
                    <td><input type="text" value="${slot.name}" id="ts-name-${index}"></td>
                    <td><input type="number" value="${slot.defaultDuration}" id="ts-duration-${index}" min="0"></td>
                    <td><input type="number" value="${slot.multiplier}" id="ts-multiplier-${index}" step="0.1" min="0"></td>
                    <td>
                        <button onclick="updateTimeSlot(${index})">更新</button>
                        <button onclick="deleteTimeSlot(${index})" class="delete-button">删除</button>
                    </td>
                </tr>
            `;
        });
    } else {
         editorHtml += `<tr><td colspan="5">暂无时段信息</td></tr>`;
    }
    editorHtml += `
            </tbody>
        </table>
        <hr>
        <h5>新增时段</h5>
        <div>
            ID: <input type="text" id="new-ts-id" placeholder="自动生成"> <small>(自动生成)</small><br>
            名称: <input type="text" id="new-ts-name" required>
            时长: <input type="number" id="new-ts-duration" min="0" value="40" required>
            乘数: <input type="number" id="new-ts-multiplier" step="0.1" min="0" value="1.0" required>
            <button onclick="addTimeSlot()">添加</button>
        </div>
    `;
    editor.innerHTML = editorHtml;
}


/**
 * 添加新的时段类型 (调用 data.js 的函数)
 */
function addTimeSlot() {
    // const idInput = document.getElementById('new-ts-id'); // ID现在自动生成
    const nameInput = document.getElementById('new-ts-name');
    const durationInput = document.getElementById('new-ts-duration');
    const multiplierInput = document.getElementById('new-ts-multiplier');

    // const id = idInput.value.trim(); // ID 自动生成
    const name = nameInput.value.trim();
    const duration = parseInt(durationInput.value, 10);
    const multiplier = parseFloat(multiplierInput.value);

    if (!name || isNaN(duration) || duration < 0 || isNaN(multiplier) || multiplier < 0) {
        alert('请输入有效的时段信息！名称不能为空，时长和乘数需为非负数。');
        return;
    }

    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const newId = generateId('TS'); // 使用 data.js 的函数生成ID

    // 检查名称是否重复（可选，但建议）
    if (timeSlots.some(slot => slot.name === name)) {
       if (!confirm(`已存在名为 "${name}" 的时段，确定要重复添加吗？`)) {
           return;
       }
    }

    const newSlot = { id: newId, name, defaultDuration: duration, multiplier };
    timeSlots.push(newSlot);
    saveData(STORAGE_KEYS.TIMESLOT_TYPES, timeSlots);

    // 清空输入框
    // idInput.value = '';
    nameInput.value = '';
    durationInput.value = '40';
    multiplierInput.value = '1.0';

    // 重新渲染列表和编辑器内容
    renderTimeSlotList();
    renderTimeSlotEditorContent(); // 重新渲染编辑器以包含新条目
    alert(`时段 "${name}" 添加成功！`);
}

/**
 * 更新现有的时段类型 (调用 data.js 的函数)
 * @param {number} index - 时段在数组中的索引
 */
function updateTimeSlot(index) {
    const id = document.getElementById(`ts-id-${index}`).value; // ID 不可编辑，但仍需获取以找到正确的对象
    const name = document.getElementById(`ts-name-${index}`).value.trim();
    const duration = parseInt(document.getElementById(`ts-duration-${index}`).value, 10);
    const multiplier = parseFloat(document.getElementById(`ts-multiplier-${index}`).value);

    if (!name || isNaN(duration) || duration < 0 || isNaN(multiplier) || multiplier < 0) {
        alert('请输入有效的时段信息！名称不能为空，时长和乘数需为非负数。');
        return;
    }

    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const slotIndex = timeSlots.findIndex(slot => slot.id === id); // 通过ID查找，更可靠

    if (slotIndex !== -1) {
        timeSlots[slotIndex] = { ...timeSlots[slotIndex], name, defaultDuration: duration, multiplier };
        saveData(STORAGE_KEYS.TIMESLOT_TYPES, timeSlots);
        renderTimeSlotList();
        renderTimeSlotEditorContent(); // 重新渲染编辑器
        alert(`时段 "${name}" 更新成功！`);
    } else {
        alert('未找到要更新的时段！');
    }
}


/**
 * 删除时段类型 (调用 data.js 的函数)
 * @param {number} index - 时段在数组中的索引
 */
function deleteTimeSlot(index) {
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const idToDelete = document.getElementById(`ts-id-${index}`).value; // 获取要删除的ID
    const slotToDelete = timeSlots.find(slot => slot.id === idToDelete);

    if (slotToDelete && confirm(`确定要删除时段 "${slotToDelete.name}" 吗？`)) {
        const updatedTimeSlots = timeSlots.filter(slot => slot.id !== idToDelete);
        saveData(STORAGE_KEYS.TIMESLOT_TYPES, updatedTimeSlots);
        renderTimeSlotList();
        renderTimeSlotEditorContent(); // 重新渲染编辑器
        alert(`时段 "${slotToDelete.name}" 删除成功！`);
    }
}

// --- 教师管理 UI ---

/**
 * 渲染教师列表
 */
function renderTeacherList() {
    const listContainer = document.getElementById('teacher-list');
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    console.log("renderTeacherList: Retrieved teachers:", teachers); // 添加调试信息
    if (!listContainer) return;

    if (teachers.length === 0) {
        listContainer.innerHTML = '<p>暂无教师信息，请点击“管理教师”添加。</p>';
        return;
    }

    let html = '<ul>';
    teachers.forEach(teacher => {
        html += `<li>${teacher.name} (时薪: ${teacher.defaultHourlyRate})</li>`;
    });
    html += '</ul>';
    listContainer.innerHTML = html;
}

/**
 * 渲染教师编辑器内容
 */
function renderTeacherEditorContent() {
    const editor = document.getElementById('teacher-editor');
    if (!editor) return;

    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || []; // 获取时段数据
    console.log("renderTeacherEditorContent: Retrieved teachers:", teachers); // 添加调试信息
    let editorHtml = `
        <h5>编辑教师信息</h5>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>姓名</th>
                    <th>默认时薪</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;
    if (teachers.length > 0) {
        teachers.forEach((teacher, index) => {
            editorHtml += `
                <tr>
                    <td><input type="text" value="${teacher.id}" id="teacher-id-${index}" disabled style="background-color: #eee;"></td>
                    <td><input type="text" value="${teacher.name}" id="teacher-name-${index}"></td>
                    <td><input type="number" value="${teacher.defaultHourlyRate}" id="teacher-rate-${index}" min="0"></td>
                    <td>
                        <button onclick="updateTeacher(${index})">更新</button>
                        <button onclick="deleteTeacher(${index})" class="delete-button">删除</button>
                    </td>
                </tr>
            `;
            // 添加每周固定排课设置区域
            editorHtml += `
                <tr class="default-schedule-row">
                    <td colspan="4">
                        <div class="schedule-settings-container">
                            <button class="toggle-schedule-btn" onclick="toggleScheduleSettings(this, '${teacher.id}')">设置每周固定排课</button>
                            <div id="weekly-schedule-settings-${teacher.id}" class="weekly-schedule-settings" style="display: none;">
                                <h6>${teacher.name} 的每周固定排课：</h6>
                                <div class="schedule-days-container">
                                    ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((dayName, dayIndex) => {
                                        const daySchedule = (teacher.weeklyDefaultSchedule || {})[dayIndex] || [];
                                        return `
                                        <div class="schedule-day-item">
                                            <strong>${dayName}</strong>
                                            <div id="day-checkboxes-${teacher.id}-${dayIndex}" class="day-checkboxes-container" style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; border: 1px solid #eee; padding: 5px; margin-top: 5px;">
                                                ${timeSlots.map(slot => `
                                                    <label style="margin-right: 10px; margin-bottom: 5px; white-space: nowrap; font-weight: normal; cursor: pointer; display: inline-flex; align-items: center;">
                                                        <input type="checkbox"
                                                               name="weeklySchedule-${teacher.id}-${dayIndex}-${slot.id}"
                                                               value="${slot.id}"
                                                               ${daySchedule.includes(slot.id) ? 'checked' : ''}
                                                               style="margin-right: 3px;"
                                                        >
                                                        ${slot.name}
                                                    </label>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `;
                                    }).join('')}
                                </div>
                                <button onclick="saveWeeklyDefaultSchedule('${teacher.id}')" style="margin-top: 10px;">保存每周固定排课</button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        editorHtml += `<tr><td colspan="4">暂无教师信息</td></tr>`;
    }
    editorHtml += `
            </tbody>
        </table>
        <hr>
        <h5>新增教师</h5>
        <div>
            ID: <input type="text" id="new-teacher-id" placeholder="自动生成" disabled style="background-color: #eee;"><br>
            姓名: <input type="text" id="new-teacher-name" required>
            默认时薪: <input type="number" id="new-teacher-rate" min="0" value="190" required>
            <button onclick="addTeacher()">添加</button>
        </div>
    `;
    editor.innerHTML = editorHtml;
}

/**
 * 添加新教师
 */
function addTeacher() {
    const nameInput = document.getElementById('new-teacher-name');
    const rateInput = document.getElementById('new-teacher-rate');

    const name = nameInput.value.trim();
    const rate = parseFloat(rateInput.value);

    if (!name || isNaN(rate) || rate < 0) {
        alert('请输入有效的教师姓名和非负时薪！');
        return;
    }

    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const newId = generateId('T');

    // 检查名称是否重复
    if (teachers.some(teacher => teacher.name === name)) {
        if (!confirm(`已存在名为 "${name}" 的教师，确定要重复添加吗？`)) {
            return;
        }
    }

    const newTeacher = { id: newId, name, defaultHourlyRate: rate, weeklyDefaultSchedule: {} }; // 初始化 weeklyDefaultSchedule
    teachers.push(newTeacher);
    saveData(STORAGE_KEYS.TEACHERS, teachers);

    nameInput.value = '';
    rateInput.value = '190';

    renderTeacherList();
    renderTeacherEditorContent();
    alert(`教师 "${name}" 添加成功！`);
}

/**
 * 更新教师信息
 * @param {number} index - 教师在数组中的索引
 */
function updateTeacher(index) {
    const id = document.getElementById(`teacher-id-${index}`).value;
    const name = document.getElementById(`teacher-name-${index}`).value.trim();
    const rate = parseFloat(document.getElementById(`teacher-rate-${index}`).value);

    if (!name || isNaN(rate) || rate < 0) {
        alert('请输入有效的教师姓名和非负时薪！');
        return;
    }

    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const teacherIndex = teachers.findIndex(t => t.id === id);

    if (teacherIndex !== -1) {
        // 保留 weeklyDefaultSchedule, 只更新 name 和 rate
        teachers[teacherIndex].name = name;
        teachers[teacherIndex].defaultHourlyRate = rate;
        // weeklyDefaultSchedule 的更新由 saveWeeklyDefaultSchedule 函数处理
        saveData(STORAGE_KEYS.TEACHERS, teachers);
        renderTeacherList();
        renderTeacherEditorContent();
        alert(`教师 "${name}" 更新成功！`);
    } else {
        alert('未找到要更新的教师！');
    }
}

/**
 * 删除教师
 * @param {number} index - 教师在数组中的索引
 */
function deleteTeacher(index) {
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const idToDelete = document.getElementById(`teacher-id-${index}`).value;
    const teacherToDelete = teachers.find(t => t.id === idToDelete);

    if (teacherToDelete && confirm(`确定要删除教师 "${teacherToDelete.name}" 吗？删除后相关的排班和薪资信息可能需要手动处理。`)) {
        const updatedTeachers = teachers.filter(t => t.id !== idToDelete);
        saveData(STORAGE_KEYS.TEACHERS, updatedTeachers);
        renderTeacherList();
        renderTeacherEditorContent();
        alert(`教师 "${teacherToDelete.name}" 删除成功！`);
    }
}


// --- 排班模板管理 UI ---

/**
 * 渲染排班模板列表
 */
function renderTemplateList() {
    const listContainer = document.getElementById('template-list');
    const templates = getData(STORAGE_KEYS.SCHEDULE_TEMPLATES, []) || [];
    if (!listContainer) return;

    if (templates.length === 0) {
        listContainer.innerHTML = '<p>暂无排班模板，请点击“管理模板”添加。</p>';
        return;
    }

    let html = '<ul>';
    templates.forEach((template, index) => {
        html += `
            <li>
                ${template.name}
                <button onclick="viewUpdateTemplate(${index})" style="margin-left: 10px;">查看/编辑</button>
                <button onclick="deleteTemplate(${index})" class="delete-button" style="margin-left: 5px;">删除</button>
            </li>
        `;
    });
    html += '</ul>';
    listContainer.innerHTML = html;
}

/**
 * 渲染排班模板编辑器内容
 */
function renderTemplateEditorContent(templateIndex = null) {
    const editor = document.getElementById('template-editor');
    if (!editor) return;

    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const templates = getData(STORAGE_KEYS.SCHEDULE_TEMPLATES, []) || [];
    let templateToEdit = null;
    let isEditing = templateIndex !== null && templates[templateIndex];

    if (isEditing) {
        templateToEdit = templates[templateIndex];
    }

    let editorHtml = `<h5>${isEditing ? '编辑排班模板' : '新增排班模板'}</h5>`;

    if (isEditing) {
        editorHtml += `<div>ID: ${templateToEdit.id}</div>`;
    }
    editorHtml += `
        <div>
            模板名称: <input type="text" id="template-name" value="${isEditing ? templateToEdit.name : ''}" required>
        </div>
        <h6>每日排班设置：</h6>
        <div class="template-days-container">
    `;

    const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (let i = 0; i < 7; i++) { // 0: 周日, 1: 周一, ..., 6: 周六
        editorHtml += `
            <div class="template-day-item">
                <strong>${daysOfWeek[i]}</strong>
                <div id="day-slots-${i}" class="day-slots">
        `;
        const daySchedule = isEditing && templateToEdit.templateData[i] ? templateToEdit.templateData[i] : [];
        daySchedule.forEach(entry => {
            const slot = timeSlots.find(s => s.id === entry.timeSlotId);
            if (slot) {
                editorHtml += `<span class="selected-slot">${slot.name} <button onclick="removeTemplateSlot(this)">x</button><input type="hidden" value="${slot.id}"></span>`;
            }
        });
        editorHtml += `
                </div>
                <select onchange="addSlotToTemplateDay(${i})">
                    <option value="">添加时段</option>
                    ${timeSlots.map(slot => `<option value="${slot.id}">${slot.name}</option>`).join('')}
                </select>
            </div>
        `;
    }

    editorHtml += `
        </div>
        <button onclick="saveTemplateDetails(${isEditing ? `'${templateToEdit.id}'` : null})" style="margin-top: 15px;">${isEditing ? '保存更改' : '添加模板'}</button>
        ${isEditing ? '<button onclick="renderTemplateEditorContent()" style="margin-left: 10px;">取消编辑 (返回新增)</button>' : ''}
    `;
    editor.innerHTML = editorHtml;
}


/**
 * 添加新模板
 */
function addTemplate() {
    const nameInput = document.getElementById('new-template-name'); // 假设有这个输入框
    if (!nameInput) {
        renderTemplateEditorContent(); // 如果没有，则渲染编辑器让用户输入
        return;
    }
    const name = nameInput.value.trim();
    if (!name) {
        alert('请输入模板名称！');
        return;
    }

    const templates = getData(STORAGE_KEYS.SCHEDULE_TEMPLATES, []) || [];
    const newId = generateId('TPL');
    const newTemplate = {
        id: newId,
        name: name,
        templateData: {} // 初始化为空对象 { dayIndex: [{timeSlotId, notes}, ...], ... }
    };
    templates.push(newTemplate);
    saveData(STORAGE_KEYS.SCHEDULE_TEMPLATES, templates);

    renderTemplateList();
    renderTemplateEditorContent(templates.length - 1); // 跳转到编辑新创建的模板
    alert(`模板 "${name}" 添加成功！请继续设置每日排班。`);
}

/**
 * 删除排班模板
 * @param {number} index - 模板在数组中的索引
 */
function deleteTemplate(index) {
    const templates = getData(STORAGE_KEYS.SCHEDULE_TEMPLATES, []) || [];
    if (templates[index] && confirm(`确定要删除模板 "${templates[index].name}" 吗？`)) {
        templates.splice(index, 1);
        saveData(STORAGE_KEYS.SCHEDULE_TEMPLATES, templates);
        renderTemplateList();
        renderTemplateEditorContent(); // 刷新编辑器，回到新增状态
        alert('模板删除成功！');
    }
}

/**
 * 查看或更新模板（加载到编辑器中）
 * @param {number} index - 模板在数组中的索引
 */
function viewUpdateTemplate(index) {
    renderTemplateEditorContent(index);
}

/**
 * 从模板的某一天移除一个时段 (仅UI)
 * @param {HTMLElement} removeButton - 被点击的移除按钮
 */
function removeTemplateSlot(removeButton) {
    removeButton.parentNode.remove(); // 移除包含时段和按钮的span
}

/**
 * 向模板的某一天添加一个时段 (仅UI)
 * @param {number} dayIndex - 星期几 (0-6)
 */
function addSlotToTemplateDay(dayIndex) {
    const daySlotsDiv = document.getElementById(`day-slots-${dayIndex}`);
    const selectElement = daySlotsDiv.nextElementSibling; // 获取旁边的select元素
    const timeSlotId = selectElement.value;

    if (!timeSlotId || !daySlotsDiv) return;

    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const selectedTimeSlot = timeSlots.find(ts => ts.id === timeSlotId);

    if (!selectedTimeSlot) return;

    // 检查是否已存在（避免重复添加）
    const existingSlots = Array.from(daySlotsDiv.querySelectorAll('input[type="hidden"]')).map(input => input.value);
    if (existingSlots.includes(timeSlotId)) {
        alert('该时段已存在于此日期。');
        selectElement.value = ''; // 重置选择框
        return;
    }

    const slotHtml = `<span class="selected-slot">${selectedTimeSlot.name} <button onclick="removeTemplateSlot(this)">x</button><input type="hidden" value="${selectedTimeSlot.id}"></span>`;
    daySlotsDiv.insertAdjacentHTML('beforeend', slotHtml);
    selectElement.value = ''; // 重置选择框
}

/**
 * 保存模板详情（新增或更新）
 * @param {string|null} templateId - 如果是更新，则为模板ID；如果是新增，则为null
 */
function saveTemplateDetails(templateId) {
    const templateNameInput = document.getElementById('template-name');
    const newTemplateName = templateNameInput.value.trim();

    if (!newTemplateName) {
        alert('请输入模板名称！');
        return;
    }

    const newTemplateData = {};
    for (let i = 0; i < 7; i++) {
        const daySlotsDiv = document.getElementById(`day-slots-${i}`);
        if (daySlotsDiv) {
            const slotsForDay = Array.from(daySlotsDiv.querySelectorAll('input[type="hidden"]'))
                .map(input => ({ timeSlotId: input.value })); // 简单结构，只存timeSlotId
            if (slotsForDay.length > 0) {
                newTemplateData[i] = slotsForDay;
            }
        }
    }

    const templates = getData(STORAGE_KEYS.SCHEDULE_TEMPLATES, []) || [];
    if (templateId) { // 更新现有模板
        const templateIndex = templates.findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
            templates[templateIndex].name = newTemplateName;
            templates[templateIndex].templateData = newTemplateData;
        } else {
            alert('未找到要更新的模板！');
            return;
        }
    } else { // 新增模板
        const newId = generateId('TPL');
        templates.push({ id: newId, name: newTemplateName, templateData: newTemplateData });
    }

    saveData(STORAGE_KEYS.SCHEDULE_TEMPLATES, templates);
    renderTemplateList();
    alert(`模板 "${newTemplateName}" 及其排班信息保存成功！`);
    renderTemplateEditorContent(); // 刷新编辑器主界面
}

/**
 * 初始化薪资计算模块的UI界面
 */
function initPayrollUI() {
    console.log("initPayrollUI: Function called."); // DEBUG LOG
    const payrollSection = document.getElementById('payroll-section');
    if (payrollSection) {
        console.log("initPayrollUI: Found payrollSection element. About to set innerHTML."); // DEBUG LOG
        payrollSection.innerHTML = `
            <h3>薪资计算与审批</h3>
            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
                <div>
                    <label for="payroll-month-select">选择月份:</label>
                    <input type="month" id="payroll-month-select" value="${new Date().toISOString().slice(0, 7)}" onchange="calculateAndDisplayPayroll()">
                </div>
                <div>
                    <label for="payroll-teacher-select">选择教师:</label>
                    <select id="payroll-teacher-select" onchange="calculateAndDisplayPayroll()">
                        <option value="">-- 选择教师 --</option>
                        <!-- 教师选项将在此处动态填充 -->
                    </select>
                </div>
                <!-- 移除“计算薪资”按钮，改为自动计算 -->
            </div>
            <div id="payroll-summary-view">
                <p>选择月份和教师以查看薪资签到表。</p>
                <!-- 薪资签到表将在这里渲染 -->
            </div>
            <div id="payroll-report-section" style="margin-top: 20px;">
                <h4>薪资报表 (待开发)</h4>
                <button disabled>生成报表</button>
            </div>
        `;
        // 填充教师选择器
        const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
        const teacherSelect = document.getElementById('payroll-teacher-select');
        if (teacherSelect) {
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
            // 如果有教师，默认选中第一个教师并加载薪资
            if (teachers.length > 0) {
                teacherSelect.value = teachers[0].id;
                calculateAndDisplayPayroll(); // 初始加载薪资
            } else {
                // 如果没有教师，确保payrollSummaryView显示提示信息
                const payrollSummaryView = document.getElementById('payroll-summary-view');
                if(payrollSummaryView) {
                    payrollSummaryView.innerHTML = '<p>系统中没有教师数据，请先在系统设置中添加教师。</p>';
                }
            }
        }
        // calculateAndDisplayPayroll(); // 已移到上面条件块中
    } else {
        console.error("Payroll section not found!");
    }
}

/**
 * 计算并显示指定月份的薪资签到表 (新版复杂表格样式)。
 * 此函数根据选定的教师和月份，获取排班、请假等数据，
 * 然后动态生成一个符合特定格式要求的HTML表格来展示详细的每日工时、
 * 各时段小计、月度总计以及薪资相关信息。
 * 支持代班、默认排班的显示，并提供薪资调整、备注、保存和确认功能。
 */
function calculateAndDisplayPayroll() {
    console.log("calculateAndDisplayPayroll: Starting payroll calculation for selected teacher based on new format.");
    const monthSelect = document.getElementById('payroll-month-select');
    const teacherSelect = document.getElementById('payroll-teacher-select');
    const selectedMonth = monthSelect.value; // YYYY-MM 格式
    const selectedTeacherId = teacherSelect.value;
    const payrollSummaryView = document.getElementById('payroll-summary-view');

    if (!selectedMonth || !selectedTeacherId || !payrollSummaryView) {
        payrollSummaryView.innerHTML = '<p>请选择月份和教师以查看薪资签到表。</p>';
        console.log("calculateAndDisplayPayroll: Month, teacher, or summary view not found. Exiting.");
        return;
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']; // 0: Sunday, 1: Monday, ..., 6: Saturday

    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || []; // 获取所有时间段类型
    const monthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {})[selectedMonth] || [];
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];
    const payslips = getData(STORAGE_KEYS.PAYSLIPS, {})[selectedMonth] || {};

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

    if (!selectedTeacher) {
        payrollSummaryView.innerHTML = '<p>未找到选定的教师。</p>';
        console.log("calculateAndDisplayPayroll: Selected teacher not found.");
        return;
    }

    console.log(`calculateAndDisplayPayroll: Processing payroll for ${selectedTeacher.name} for ${selectedMonth} (new format)`);

    // 构建表头 (根据图片样式)
    // 假设 timeSlots 的顺序就是图片中节次的顺序

    let payrollHtml = `
        <table border="1" style="width: 100%; border-collapse: collapse; text-align: center; font-size: 14px;">
            <thead>
                <tr>
                    <th colspan="2" rowspan="2" style="width: 80px; vertical-align: middle;">日期/星期</th>
                    <th colspan="${timeSlots.length + 2}" style="text-align: center; height: 50px; vertical-align: middle;">
                        新 北 市 後 埔 國 小 ${year - 1911} 學 年 第 ${month <= 7 ? 1 : 2} 學 期 ${month} 月 助 理 員 簽 到 表 - ${selectedTeacher.name}
                    </th>
                </tr>
                <tr>
                    <th>節次</th>
                    <th>時間</th>
    `;
    timeSlots.forEach(slot => {
        payrollHtml += `<th>${slot.name}</th>`;
    });
    payrollHtml += `
                </tr>
                <tr>
                    <th style="width: 40px;">日期</th>
                    <th style="width: 40px;">星期</th>
                    <th colspan="2">時段/分鐘</th>
    `;
    timeSlots.forEach(slot => {
        payrollHtml += `<th>${slot.defaultDuration} 分鐘</th>`;
    });
    payrollHtml += `
                </tr>
            </thead>
            <tbody>
    `;

    let totalMonthlyEffectiveMinutes = 0;
    let timeSlotDailyTotals = {}; // 存储每个时间段的总分钟数
    timeSlots.forEach(slot => timeSlotDailyTotals[slot.id] = 0); // 初始化

    // 遍历当月每一天
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0); // 规范化日期以便比较
        const dayOfWeek = date.getDay(); // 0: Sunday, 1: Monday, ...

        payrollHtml += `
                <tr>
                    <td>${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}</td>
                    <td>${weekdays[dayOfWeek]}</td>
                    <td colspan="2"></td> 
        `;


        // 检查当前教师当天是否有请假
        const isOnLeave = leaveRecords.some(record => {
            const recordStartDate = new Date(record.startDate);
            const recordEndDate = new Date(record.endDate);
            recordStartDate.setHours(0, 0, 0, 0);
            recordEndDate.setHours(0, 0, 0, 0);
            return record.teacherId === selectedTeacher.id && date >= recordStartDate && date <= recordEndDate;
        });

        timeSlots.forEach(slot => {
            let effectiveMinutes = 0;
            let cellContent = ''; // 单元格内容默认为空

            if (isOnLeave) {
                // 如果请假，则工时为0，单元格显示 "請假"
                cellContent = '請假';
            } else {
                // 查找实际排班
                const actualEntry = monthlySchedules.find(entry =>
                    entry.teacherId === selectedTeacher.id &&
                    entry.day === day &&
                    entry.timeSlotId === slot.id
                );

                if (actualEntry) {
                    // 如果有实际排班
                    if ((actualEntry.isSubstitute && actualEntry.substituteTeacherId === selectedTeacher.id) ||
                        (!actualEntry.isSubstitute && actualEntry.teacherId === selectedTeacher.id)) {
                        effectiveMinutes = slot.defaultDuration * slot.multiplier;
                        cellContent = effectiveMinutes.toString(); // 显示工时
                    } else if (actualEntry.isSubstitute && actualEntry.teacherId === selectedTeacher.id && actualEntry.substituteTeacherId) {
                        // 原本是该老师的班，但被别人代了
                        const substituteTeacher = teachers.find(t => t.id === actualEntry.substituteTeacherId);
                        cellContent = substituteTeacher ? `代:${substituteTeacher.name}` : '代班';
                    }
                } else {
                    // 如果没有实际排班，则检查默认排班
                    const defaultScheduleForDay = (selectedTeacher.weeklyDefaultSchedule && selectedTeacher.weeklyDefaultSchedule[dayOfWeek]) ? selectedTeacher.weeklyDefaultSchedule[dayOfWeek] : [];
                    if (defaultScheduleForDay.includes(slot.id)) {
                        effectiveMinutes = slot.defaultDuration * slot.multiplier;
                        cellContent = effectiveMinutes.toString(); // 显示工时
                    }
                }
            }
            
            payrollHtml += `<td>${cellContent}</td>`;
            timeSlotDailyTotals[slot.id] += effectiveMinutes; 
            totalMonthlyEffectiveMinutes += effectiveMinutes;
        });
        payrollHtml += `</tr>`;
    }

    // 小计(分钟)行
    payrollHtml += `
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">小計(分鐘)</td>
                    <td colspan="2"></td> 
    `;
    timeSlots.forEach(slot => {
        payrollHtml += `<td>${timeSlotDailyTotals[slot.id]}</td>`;
    });
    payrollHtml += `
                </tr>
    `;

    // 底部汇总行
    const totalMonthlyHours = totalMonthlyEffectiveMinutes / 60;
    const calculatedSalary = totalMonthlyHours * selectedTeacher.defaultHourlyRate;
    const currentPayslip = payslips[selectedTeacher.id] || { adjustment: 0, notes: '', finalSalary: calculatedSalary, status: '未确认' };
    const finalSalary = calculatedSalary + (parseFloat(currentPayslip.adjustment) || 0);


    const colspanForSummary = timeSlots.length + 2; // "节次" "时间" 和所有时间段

    payrollHtml += `
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">總計 (分鐘) ：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left; font-weight: bold;">${totalMonthlyEffectiveMinutes.toFixed(0)}</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">總計 (小時) ：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left; font-weight: bold;">${totalMonthlyHours.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">每小時薪資：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;">${selectedTeacher.defaultHourlyRate.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">本月工時薪資：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;">${calculatedSalary.toFixed(2)} 元</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">調整金額：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;">
                        <input type="number" id="adj-${selectedTeacher.id}" value="${(currentPayslip.adjustment || 0).toFixed(2)}" onchange="updateFinalSalary('${selectedTeacher.id}', '${selectedMonth}')" ${currentPayslip.status === '已确认' ? 'disabled' : ''} style="width: 80px; text-align: center;">
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">最終薪資：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;"><span id="final-salary-${selectedTeacher.id}">${finalSalary.toFixed(2)}</span></td>
                </tr>
                 <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">備註：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;">
                        <input type="text" id="notes-${selectedTeacher.id}" value="${currentPayslip.notes || ''}" ${currentPayslip.status === '已确认' ? 'disabled' : ''} style="width: 80%;">
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">狀態：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;"><span id="status-${selectedTeacher.id}">${currentPayslip.status}</span></td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">操作：</td>
                    <td colspan="${colspanForSummary}" style="text-align: left;">
                        <button onclick="savePayslip('${selectedTeacher.id}', '${selectedMonth}')" ${currentPayslip.status === '已确认' ? 'disabled' : ''}>保存</button>
                        <button onclick="confirmPayslip('${selectedTeacher.id}', '${selectedMonth}')" ${currentPayslip.status === '已确认' ? 'disabled' : ''}>确认</button>
                    </td>
                </tr>
                <tr>
                    <td colspan="${2 + colspanForSummary}" style="text-align: right; height: 50px; vertical-align: bottom;">簽 名 ：_________________________</td>
                </tr>
            </tbody>
        </table>
    `;

    payrollSummaryView.innerHTML = payrollHtml;
    console.log("calculateAndDisplayPayroll: Payroll sign-in sheet rendered with new format.");

    // Update final salary if adjustment exists
    updateFinalSalary(selectedTeacher.id, selectedMonth);
}
/**
 * 根据调整金额更新最终薪资显示
 * @param {string} teacherId - 教师ID
 * @param {string} month - 月份 (YYYY-MM)
 */
function updateFinalSalary(teacherId, month) {
    const adjInput = document.getElementById(`adj-${teacherId}`);
    const finalSalarySpan = document.getElementById(`final-salary-${teacherId}`);
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const selectedTeacher = teachers.find(t => t.id === teacherId);

    if (!adjInput || !finalSalarySpan || !selectedTeacher) {
        console.error("updateFinalSalary: Required elements or teacher not found.");
        return;
    }

    const adjustment = parseFloat(adjInput.value) || 0;

    // 重新计算总工时和计算薪资 (为了确保数据一致性，尽管通常调整金额不会影响计算薪资本身)
    // 这里可以简化为直接从 calculateAndDisplayPayroll 获得的 calculatedSalary
    // 但为了独立性，这里简单获取一次
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const monthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {})[month] || [];
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];

    let totalEffectiveMinutes = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, mon - 1, day);
        date.setHours(0, 0, 0, 0); // Normalize date for comparison

        const isOnLeave = leaveRecords.some(record => {
            const recordStartDate = new Date(record.startDate);
            const recordEndDate = new Date(record.endDate);
            recordStartDate.setHours(0, 0, 0, 0);
            recordEndDate.setHours(0, 0, 0, 0);
            return record.teacherId === teacherId && date >= recordStartDate && date <= recordEndDate;
        });

        if (!isOnLeave) {
            const actualEntries = monthlySchedules.filter(entry =>
                entry.teacherId === teacherId && entry.day === day
            );

            if (actualEntries.length > 0) {
                actualEntries.forEach(entry => {
                    const slot = timeSlots.find(s => s.id === entry.timeSlotId);
                    if (slot && ((entry.isSubstitute && entry.substituteTeacherId === teacherId) || (!entry.isSubstitute && entry.teacherId === teacherId))) {
                        totalEffectiveMinutes += slot.defaultDuration * slot.multiplier;
                    }
                });
            } else {
                const dayOfWeek = date.getDay();
                const defaultScheduleForDay = (selectedTeacher.weeklyDefaultSchedule && selectedTeacher.weeklyDefaultSchedule[dayOfWeek]) ? selectedTeacher.weeklyDefaultSchedule[dayOfWeek] : [];
                defaultScheduleForDay.forEach(slotId => {
                    const slot = timeSlots.find(s => s.id === slotId);
                    if (slot) {
                        totalEffectiveMinutes += slot.defaultDuration * slot.multiplier;
                    }
                });
            }
        }
    }
    const calculatedSalary = (totalEffectiveMinutes / 60) * selectedTeacher.defaultHourlyRate;
    const finalSalary = calculatedSalary + adjustment;
    finalSalarySpan.textContent = finalSalary.toFixed(2);

    console.log(`updateFinalSalary: Teacher ${teacherId} for ${month} - Adjustment: ${adjustment}, Final Salary: ${finalSalary.toFixed(2)}`);
}

/**
 * 保存薪资单
 * @param {string} teacherId - 教师ID
 * @param {string} month - 月份 (YYYY-MM)
 */
function savePayslip(teacherId, month) {
    const adjInput = document.getElementById(`adj-${teacherId}`);
    const statusSpan = document.getElementById(`status-${teacherId}`);
    const finalSalarySpan = document.getElementById(`final-salary-${teacherId}`);

    if (!adjInput || !statusSpan || !finalSalarySpan) {
        console.error("savePayslip: Required elements not found.");
        return;
    }

    let payslips = getData(STORAGE_KEYS.PAYSLIPS, {});
    if (!payslips[month]) {
        payslips[month] = {};
    }

    const adjustment = parseFloat(adjInput.value) || 0;
    const finalSalary = parseFloat(finalSalarySpan.textContent) || 0;

    // 获取计算薪资（需要重新计算或从现有数据中获取）
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const selectedTeacher = teachers.find(t => t.id === teacherId);
    if (!selectedTeacher) {
        console.error("savePayslip: Teacher not found.");
        return;
    }

    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const monthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {})[month] || [];
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];

    let totalEffectiveMinutes = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, mon - 1, day);
        date.setHours(0, 0, 0, 0); // Normalize date for comparison

        const isOnLeave = leaveRecords.some(record => {
            const recordStartDate = new Date(record.startDate);
            const recordEndDate = new Date(record.endDate);
            recordStartDate.setHours(0, 0, 0, 0);
            recordEndDate.setHours(0, 0, 0, 0);
            return record.teacherId === teacherId && date >= recordStartDate && date <= recordEndDate;
        });

        if (!isOnLeave) {
            const actualEntries = monthlySchedules.filter(entry =>
                entry.teacherId === teacherId && entry.day === day
            );

            if (actualEntries.length > 0) {
                actualEntries.forEach(entry => {
                    const slot = timeSlots.find(s => s.id === entry.timeSlotId);
                    if (slot && ((entry.isSubstitute && entry.substituteTeacherId === teacherId) || (!entry.isSubstitute && entry.teacherId === teacherId))) {
                        totalEffectiveMinutes += slot.defaultDuration * slot.multiplier;
                    }
                });
            } else {
                const dayOfWeek = date.getDay();
                const defaultScheduleForDay = (selectedTeacher.weeklyDefaultSchedule && selectedTeacher.weeklyDefaultSchedule[dayOfWeek]) ? selectedTeacher.weeklyDefaultSchedule[dayOfWeek] : [];
                defaultScheduleForDay.forEach(slotId => {
                    const slot = timeSlots.find(s => s.id === slotId);
                    if (slot) {
                        totalEffectiveMinutes += slot.defaultDuration * slot.multiplier;
                    }
                });
            }
        }
    }
    const calculatedSalary = (totalEffectiveMinutes / 60) * selectedTeacher.defaultHourlyRate;

    payslips[month][teacherId] = {
        teacherId: teacherId,
        month: month,
        calculatedSalary: calculatedSalary,
        adjustment: adjustment,
        finalSalary: finalSalary,
        status: statusSpan.textContent // Preserve current status
    };

    saveData(STORAGE_KEYS.PAYSLIPS, payslips);
    alert('薪资单保存成功！');
    console.log(`savePayslip: Payslip for ${teacherId} in ${month} saved.`);
}

/**
 * 确认薪资单
 * @param {string} teacherId - 教师ID
 * @param {string} month - 月份 (YYYY-MM)
 */
function confirmPayslip(teacherId, month) {
    if (!confirm('确认后将无法修改薪资单，确定要确认吗？')) {
        return;
    }

    let payslips = getData(STORAGE_KEYS.PAYSLIPS, {});
    if (!payslips[month] || !payslips[month][teacherId]) {
        alert('没有可确认的薪资单。请先计算并保存。');
        console.warn(`confirmPayslip: No payslip found for ${teacherId} in ${month}.`);
        return;
    }

    payslips[month][teacherId].status = '已确认';
    saveData(STORAGE_KEYS.PAYSLIPS, payslips);
    alert('薪资单已确认！');
    console.log(`confirmPayslip: Payslip for ${teacherId} in ${month} confirmed.`);

    // 重新渲染UI以禁用相关控件
    calculateAndDisplayPayroll();

    // Update final salary if adjustment exists
    updateFinalSalary(selectedTeacher.id, selectedMonth);
}

// --- 排班与工时模块 UI (待完善) ---

/**
 * 初始化排班与工时模块的UI界面
 */
function initScheduleUI() {
    const scheduleSection = document.getElementById('schedule-section');
    if (scheduleSection) {
        scheduleSection.innerHTML = `
            <h3>排班与工时管理</h3>
            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
                <div>
                    <label for="schedule-month-select">选择月份:</label>
                    <input type="month" id="schedule-month-select" value="${new Date().toISOString().slice(0, 7)}" onchange="loadAndRenderMonthlySchedule()">
                </div>
                <div>
                    <label for="schedule-teacher-select">选择教师:</label>
                    <select id="schedule-teacher-select" onchange="loadAndRenderMonthlySchedule()">
                        <option value="">-- 选择教师 --</option>
                        <!-- 教师选项将在此处动态填充 -->
                    </select>
                </div>
                <!-- 移除“加载排班”按钮，改为自动加载 -->
            </div>
            <div id="monthly-schedule-view">
                <p>选择月份和教师以加载排班。</p>
                <!-- 月度排班表将在这里渲染 -->
            </div>
            <div id="leave-adjustment-section" style="margin-top: 20px;">
                <h4>请假与代班管理</h4>
                <button onclick="toggleEditor('leave-editor')">管理请假</button>
                <div id="leave-list" style="margin-top: 10px;"></div>
                <div id="leave-editor" class="editor-section"></div>
            </div>
        `;
        // 填充教师选择器
        const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
        const teacherSelect = document.getElementById('schedule-teacher-select');
        if (teacherSelect) {
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
            // 如果有教师，默认选中第一个教师并加载排班
            if (teachers.length > 0) {
                teacherSelect.value = teachers[0].id;
            }
        }
        
        // 初始加载排班 (在教师选择器填充并可能设置默认值后)
        loadAndRenderMonthlySchedule();
    } else {
        console.error("Schedule section not found!");
    }
}

/**
 * 加载并渲染指定月份的排班表
 */
function loadAndRenderMonthlySchedule() {
    const monthSelect = document.getElementById('schedule-month-select');
    const teacherSelect = document.getElementById('schedule-teacher-select');
    const scheduleView = document.getElementById('monthly-schedule-view');

    if (!monthSelect || !teacherSelect || !scheduleView) {
        console.error("Required elements for rendering schedule not found.");
        scheduleView.innerHTML = '<p>无法加载排班视图，缺少必要的页面元素。</p>';
        return;
    }

    const selectedMonthYear = monthSelect.value; // YYYY-MM 格式
    const selectedTeacherId = teacherSelect.value;

    if (!selectedMonthYear) {
        scheduleView.innerHTML = '<p>请选择月份以加载排班。</p>';
        return;
    }

    if (!selectedTeacherId) {
        scheduleView.innerHTML = '<p>请选择一位教师以查看其详细排班。</p>';
        return;
    }

    const [year, month] = selectedMonthYear.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    const allTeachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const targetTeacher = allTeachers.find(t => t.id === selectedTeacherId);
    const allTimeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const monthlySchedulesData = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {});
    const currentMonthSchedules = monthlySchedulesData[selectedMonthYear] || [];
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];

    if (!targetTeacher) {
        scheduleView.innerHTML = '<p>未找到选定的教师信息。</p>';
        return;
    }
    if (allTimeSlots.length === 0) {
        scheduleView.innerHTML = '<p>请先在“系统设置”中定义课程/时段。</p>';
        return;
    }

    let scheduleHtml = `
        <h4>${targetTeacher.name} - ${year}年${month}月排班表</h4>
        <table border="1" style="width: 100%; border-collapse: collapse; table-layout: fixed;">
            <thead>
                <tr>
                    <th style="width: 120px;">课堂/日期</th>`; // 固定第一列宽度

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i);
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        scheduleHtml += `<th style="text-align: center; ${isWeekend ? 'background-color: #f0f0f0;' : ''}">${month}/${i}<br>${weekdays[dayOfWeek]}</th>`;
    }
    scheduleHtml += `
                </tr>
            </thead>
            <tbody>`;

    allTimeSlots.forEach(slot => {
        scheduleHtml += `<tr><td style="font-weight: bold;">${slot.name}</td>`;
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDateObj = new Date(year, month - 1, day); // Renamed to avoid conflict
            const dayOfWeek = currentDateObj.getDay();
            let cellContent = '';
            let isDefaultSchedule = false;
            let isActualSchedule = false;
            let scheduleEntry = null;

            // 1. 检查请假
            const isOnLeave = leaveRecords.some(record => {
                if (record.teacherId !== selectedTeacherId) return false;
                // Ensure dates are compared correctly at the day level
                const leaveStartDate = new Date(record.startDate);
                leaveStartDate.setHours(0, 0, 0, 0);
                const leaveEndDate = new Date(record.endDate);
                leaveEndDate.setHours(0, 0, 0, 0);
                const currentDayDate = new Date(year, month - 1, day);
                currentDayDate.setHours(0, 0, 0, 0);
                return currentDayDate >= leaveStartDate && currentDayDate <= leaveEndDate;
            });

            if (isOnLeave) {
                cellContent = '<span style="color: orange;">假</span>';
            } else {
                // 2. 检查月度排班
                scheduleEntry = currentMonthSchedules.find(entry =>
                    entry.teacherId === selectedTeacherId &&
                    entry.day === day &&
                    entry.timeSlotId === slot.id
                );

                if (scheduleEntry) {
                    isActualSchedule = true;
                    cellContent = scheduleEntry.isSubstitute ? '<span style="color: blue;">代✓</span>' : '<span style="color: green;">✓</span>';
                } else {
                    // 3. 检查默认排班
                    const weeklyDefault = targetTeacher.weeklyDefaultSchedule || {};
                    const defaultSlotsForDay = weeklyDefault[dayOfWeek] || [];
                    if (defaultSlotsForDay.includes(slot.id)) {
                        isDefaultSchedule = true;
                        cellContent = '<span style="color: #aaa;">默认✓</span>';
                    } else {
                        cellContent = '-'; // 无安排
                    }
                }
            }
            
            scheduleHtml += `<td class="schedule-cell"
                                 data-teacher-id="${selectedTeacherId}"
                                 data-year="${year}"
                                 data-month="${month}"
                                 data-day="${day}"
                                 data-timeslot-id="${slot.id}"
                                 data-is-default="${isDefaultSchedule}"
                                 data-is-actual="${isActualSchedule}"
                                 onclick="editScheduleCell(this)"
                                 style="text-align: center; cursor: pointer; min-height: 2em; vertical-align: middle;">
                                 ${cellContent}
                             </td>`;
        }
        scheduleHtml += `</tr>`;
    });

    scheduleHtml += `
            </tbody>
        </table>`;
    scheduleView.innerHTML = scheduleHtml;

    // 调用 renderLeaveList (如果它存在并且需要在此处更新)
    // 例如: if (typeof renderLeaveList === 'function') renderLeaveList(year, month, selectedTeacherId);
}

/**
 * 编辑排班单元格
 * @param {HTMLElement} cellElement - 被点击的单元格元素
 */
// 全局变量，用于跟踪当前打开的编辑器，确保一次只有一个
let activeScheduleSlotEditor = null;

function closeScheduleSlotEditor() {
    if (activeScheduleSlotEditor) {
        activeScheduleSlotEditor.remove();
        activeScheduleSlotEditor = null;
    }
}

function editScheduleCell(cellElement) {
    closeScheduleSlotEditor(); // 关闭任何已存在的编辑器

    const teacherId = cellElement.dataset.teacherId;
    const year = parseInt(cellElement.dataset.year, 10);
    const month = parseInt(cellElement.dataset.month, 10); // 月份从1开始
    const day = parseInt(cellElement.dataset.day, 10);
    const timeSlotId = cellElement.dataset.timeSlotId;
    const isDefault = cellElement.dataset.isDefault === 'true';
    const isActual = cellElement.dataset.isActual === 'true';

    const selectedMonthYear = `${year}-${String(month).padStart(2, '0')}`;

    const allTeachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const targetTeacher = allTeachers.find(t => t.id === teacherId);
    const allTimeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const targetTimeSlot = allTimeSlots.find(ts => ts.id === timeSlotId);

    if (!targetTeacher || !targetTimeSlot) {
        console.error("Teacher or TimeSlot not found for editing.");
        return;
    }

    const monthlySchedulesData = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {});
    const currentMonthSchedules = monthlySchedulesData[selectedMonthYear] || [];
    let existingEntry = null;
    if (isActual) {
        existingEntry = currentMonthSchedules.find(e =>
            e.teacherId === teacherId &&
            e.day === day &&
            e.timeSlotId === timeSlotId
        );
    }

    const editorOverlay = document.createElement('div');
    editorOverlay.id = 'schedule-slot-editor-overlay';
    editorOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1000;
    `;
    editorOverlay.onclick = (e) => { // 点击遮罩层关闭编辑器
        if (e.target === editorOverlay) {
            closeScheduleSlotEditor();
        }
    };


    const editorContent = document.createElement('div');
    editorContent.id = 'schedule-slot-editor-content';
    editorContent.style.cssText = `
        background-color: white; padding: 20px; border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2); min-width: 350px;
    `;
    editorContent.onclick = (e) => e.stopPropagation(); //阻止编辑器内部点击关闭

    let html = `<h3>编辑排班</h3>`;
    html += `<p><b>教师:</b> ${targetTeacher.name}</p>`;
    html += `<p><b>日期:</b> ${year}/${month}/${day}</p>`;
    html += `<p><b>时段:</b> ${targetTimeSlot.name}</p>`;
    html += `<hr style="margin: 10px 0;">`;

    let isSubstituteChecked = existingEntry ? existingEntry.isSubstitute : false;
    let substituteTeacherIdValue = existingEntry ? existingEntry.substituteTeacherId : '';

    html += `<div>
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" id="slot-editor-is-substitute" ${isSubstituteChecked ? 'checked' : ''}>
                    是否代班?
                </label>
             </div>`;

    let teacherOptionsHtml = `<option value="">-- 选择代班教师 --</option>`;
    allTeachers.forEach(t => {
        if (t.id !== teacherId) { // 代班教师不能是自己
            teacherOptionsHtml += `<option value="${t.id}" ${substituteTeacherIdValue === t.id ? 'selected' : ''}>${t.name}</option>`;
        }
    });

    html += `<div style="margin-top: 10px;">
                <label for="slot-editor-substitute-teacher" style="display: block; margin-bottom: 5px;">代班教师:</label>
                <select id="slot-editor-substitute-teacher" style="width: 100%; padding: 8px;" ${!isSubstituteChecked ? 'disabled' : ''}>
                    ${teacherOptionsHtml}
                </select>
             </div>`;

    html += `<div style="margin-top: 20px; text-align: right;">`;

    if (isActual && existingEntry) { // 已有实际排班
        html += `<button onclick="saveScheduleSlotChange(
                        '${teacherId}', ${year}, ${month}, ${day}, '${timeSlotId}',
                        document.getElementById('slot-editor-is-substitute').checked,
                        document.getElementById('slot-editor-substitute-teacher').value,
                        '${existingEntry.id}'
                   )" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">保存修改</button>`;
        html += `<button onclick="deleteScheduleSlot('${teacherId}', ${year}, ${month}, ${day}, '${timeSlotId}')" style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">删除此排班</button>`;
    } else { // 新增排班 (无论是覆盖默认还是空白格)
         html += `<button onclick="saveScheduleSlotChange(
                        '${teacherId}', ${year}, ${month}, ${day}, '${timeSlotId}',
                        document.getElementById('slot-editor-is-substitute').checked,
                        document.getElementById('slot-editor-substitute-teacher').value,
                        null
                   )" style="padding: 8px 12px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">添加/应用排班</button>`;
        if (isDefault) {
             // 对于默认排班，没有直接的“删除”，而是通过不应用实际排班来“恢复”默认显示
        }
    }
    html += `<button onclick="closeScheduleSlotEditor()" style="padding: 8px 12px; background-color: #ccc; color: black; border: none; border-radius: 4px; cursor: pointer;">取消</button>`;
    html += `</div>`;

    editorContent.innerHTML = html;
    editorOverlay.appendChild(editorContent);
    document.body.appendChild(editorOverlay);
    activeScheduleSlotEditor = editorOverlay;

    // 事件监听器，用于根据“是否代班”复选框启用/禁用代班教师选择
    const isSubstituteCheckbox = document.getElementById('slot-editor-is-substitute');
    const substituteTeacherSelect = document.getElementById('slot-editor-substitute-teacher');
    if (isSubstituteCheckbox && substituteTeacherSelect) {
        isSubstituteCheckbox.onchange = function() {
            substituteTeacherSelect.disabled = !this.checked;
            if (!this.checked) {
                substituteTeacherSelect.value = ''; // 清空选择
            }
        };
    }
}

function saveScheduleSlotChange(teacherId, year, month, day, timeSlotId, isSubstitute, substituteTeacherId, existingEntryId) {
    const selectedMonthYear = `${year}-${String(month).padStart(2, '0')}`;
    const allMonthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {});
    let currentMonthSchedules = allMonthlySchedules[selectedMonthYear] || [];

    if (isSubstitute && !substituteTeacherId) {
        alert("请选择代班教师。");
        return;
    }
    if (isSubstitute && substituteTeacherId === teacherId) {
        alert("代班教师不能是原排班教师。");
        return;
    }


    if (existingEntryId) { // 更新现有条目
        const entryIndex = currentMonthSchedules.findIndex(e => e.id === existingEntryId);
        if (entryIndex > -1) {
            currentMonthSchedules[entryIndex].isSubstitute = isSubstitute;
            currentMonthSchedules[entryIndex].substituteTeacherId = isSubstitute ? substituteTeacherId : null;
        } else {
            console.error("Failed to find existing schedule entry to update:", existingEntryId);
            alert("更新失败，未找到原始记录。");
            return;
        }
    } else { // 添加新条目
        // 检查是否已存在该教师在该日该时段的排班，避免重复添加（理论上editScheduleCell的逻辑会处理，但双重检查）
        const duplicateEntry = currentMonthSchedules.find(e => e.teacherId === teacherId && e.day === day && e.timeSlotId === timeSlotId);
        if (duplicateEntry) {
            // 如果是覆盖默认排班，这里应该更新而不是提示重复
            const entryIndex = currentMonthSchedules.findIndex(e => e.id === duplicateEntry.id);
             currentMonthSchedules[entryIndex].isSubstitute = isSubstitute;
            currentMonthSchedules[entryIndex].substituteTeacherId = isSubstitute ? substituteTeacherId : null;
        } else {
            const newEntry = {
                id: generateId('sch'),
                teacherId: teacherId,
                day: day,
                timeSlotId: timeSlotId,
                isSubstitute: isSubstitute,
                substituteTeacherId: isSubstitute ? substituteTeacherId : null
            };
            currentMonthSchedules.push(newEntry);
        }
    }

    allMonthlySchedules[selectedMonthYear] = currentMonthSchedules;
    saveData(STORAGE_KEYS.MONTHLY_SCHEDULES, allMonthlySchedules);
    closeScheduleSlotEditor();
    loadAndRenderMonthlySchedule(); // 重新渲染视图
}

function deleteScheduleSlot(teacherId, year, month, day, timeSlotId) {
    if (!confirm("确定要删除此条排班记录吗？")) {
        return;
    }
    const selectedMonthYear = `${year}-${String(month).padStart(2, '0')}`;
    const allMonthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {});
    let currentMonthSchedules = allMonthlySchedules[selectedMonthYear] || [];

    const initialLength = currentMonthSchedules.length;
    currentMonthSchedules = currentMonthSchedules.filter(entry =>
        !(entry.teacherId === teacherId && entry.day === day && entry.timeSlotId === timeSlotId)
    );

    if (currentMonthSchedules.length === initialLength) {
        alert("未找到要删除的排班记录。");
        return;
    }

    allMonthlySchedules[selectedMonthYear] = currentMonthSchedules;
    // 如果该月份的排班记录为空了，可以考虑从 allMonthlySchedules 中移除该月份的键
    if (currentMonthSchedules.length === 0) {
        delete allMonthlySchedules[selectedMonthYear];
    }
    saveData(STORAGE_KEYS.MONTHLY_SCHEDULES, allMonthlySchedules);
    closeScheduleSlotEditor();
    loadAndRenderMonthlySchedule(); // 重新渲染视图
}

/**
 * 切换代班教师选择框的显示/禁用状态
 * @param {HTMLInputElement} checkbox - 代班复选框
 * @param {string} entryId - 对应的排班条目ID
 */
function toggleSubstituteTeacher(checkbox, entryId) {
    const select = document.getElementById(`sub-teacher-${entryId}`);
    if (select) {
        select.disabled = !checkbox.checked;
        select.style.display = checkbox.checked ? 'inline-block' : 'none';
        if (!checkbox.checked) {
            select.value = ''; // 如果取消代班，清空代班教师选择
        }
    }
}

/**
 * 向单元格添加一个时段（仅UI）
 * @param {string} teacherId
 * @param {number} day
 * @param {HTMLSelectElement} selectElement - 选择框元素本身
 * @param {string} selectedMonth - 当前选择的月份
 */
function addSlotToScheduleCell(teacherId, day, selectElement, selectedMonth) {
    const timeSlotId = selectElement.value;
    if (!timeSlotId) return;
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || []; // 获取教师列表用于代班选择
    const selectedTimeSlot = timeSlots.find(ts => ts.id === timeSlotId);
    if (!selectedTimeSlot) return;

    const popup = selectElement.closest('.schedule-editor-popup'); // 通过 selectElement 找到父级 popup
    if (popup) {
        const newEntryId = generateId('MS'); // 为新添加的条目生成一个临时ID，用于UI操作
        let teacherOptions = teachers.map(t =>
            `<option value="${t.id}">${t.name}</option>`
        ).join('');

        const newSlotHtml = `
            <div style="display: flex; align-items: center; margin-bottom: 5px; border: 1px solid #eee; padding: 5px;">
                <span style="flex-grow: 1;">${selectedTimeSlot.name}</span>
                <input type="checkbox" id="is-sub-${newEntryId}" onchange="toggleSubstituteTeacher(this, '${newEntryId}')"> 代班
                <select id="sub-teacher-${newEntryId}" style="width: 100px; margin-left: 5px; display: none;" disabled>
                    <option value="">选择代班教师</option>
                    ${teacherOptions}
                </select>
                <button onclick="this.parentNode.remove()" style="margin-left: 5px; cursor: pointer;">x</button>
                <input type="hidden" name="existing-slot" value="${selectedTimeSlot.id}">
                <input type="hidden" name="entry-id" value="${newEntryId}">
            </div>
        `;
        // 插入到现有条目和选择框之间
        selectElement.parentNode.insertAdjacentHTML('beforebegin', newSlotHtml);
        // 清空选择框
        selectElement.value = '';
    }
}

/**
 * 取消编辑排班单元格
 * @param {HTMLElement} popupElement - 弹出框元素
 */
function cancelEditScheduleCell(popupElement) {
    const cellElement = popupElement.parentNode;
    loadAndRenderMonthlySchedule(); // 重新渲染整个表格，恢复原始内容
}

/**
 * 保存排班单元格的修改
 * @param {HTMLElement} popupElement - 弹出框元素
 * @param {string} teacherId - 教师ID (原排班教师)
 * @param {number} day - 日期 (1-31)
 * @param {string} selectedMonth - 当前选择的月份
 */
function saveScheduleEntry(popupElement, teacherId, day, selectedMonth) {
    const monthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {});
    let currentMonthSchedule = monthlySchedules[selectedMonth] || [];

    // 移除当前教师和日期的所有旧条目
    currentMonthSchedule = currentMonthSchedule.filter(entry =>
        !(entry.teacherId === teacherId && entry.day === day)
    );

    // 收集新的排班条目
    const newScheduleEntries = [];
    Array.from(popupElement.querySelectorAll('input[name="existing-slot"]')).forEach(input => {
        const slotId = input.value;
        const entryDiv = input.closest('div');
        const entryId = entryDiv.querySelector('input[name="entry-id"]').value;
        const isSubstituteCheckbox = entryDiv.querySelector(`#is-sub-${entryId}`);
        const substituteTeacherSelect = entryDiv.querySelector(`#sub-teacher-${entryId}`);

        const isSubstitute = isSubstituteCheckbox ? isSubstituteCheckbox.checked : false;
        const substituteTeacherId = isSubstitute && substituteTeacherSelect ? substituteTeacherSelect.value : null;

        newScheduleEntries.push({
            id: entryId, // 使用或生成一个ID
            teacherId: teacherId, // 这是原排班教师
            day: day,
            timeSlotId: slotId,
            isSubstitute: isSubstitute,
            substituteTeacherId: substituteTeacherId, // 代班教师ID
            leaveRecordId: null // 暂不处理请假关联
        });
    });

    // 将新的排班条目添加到当前月份的排班数据中
    currentMonthSchedule.push(...newScheduleEntries);

    monthlySchedules[selectedMonth] = currentMonthSchedule;
    saveData(STORAGE_KEYS.MONTHLY_SCHEDULES, monthlySchedules);

    // 重新渲染整个表格以反映更改并关闭编辑状态
    loadAndRenderMonthlySchedule();
    alert('排班信息保存成功！');
}


// --- 请假与代班管理 UI ---

/**
 * 渲染请假记录列表
 */
function renderLeaveRecordList() {
    const listContainer = document.getElementById('leave-list');
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    if (!listContainer) return;

    if (leaveRecords.length === 0) {
        listContainer.innerHTML = '<p>暂无请假记录，请点击“管理请假”添加。</p>';
        return;
    }

    let html = `
        <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr>
                    <th>教师</th>
                    <th>请假类型</th>
                    <th>开始日期</th>
                    <th>结束日期</th>
                    <th>事由</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;
    leaveRecords.forEach((record, index) => {
        const teacher = teachers.find(t => t.id === record.teacherId);
        const teacherName = teacher ? teacher.name : '未知教师';
        html += `
            <tr>
                <td>${teacherName}</td>
                <td>${record.leaveType || '请假'}</td>
                <td>${record.startDate}</td>
                <td>${record.endDate}</td>
                <td>${record.reason || ''}</td>
                <td>
                    <button onclick="editLeaveRecord(${index})">编辑</button>
                    <button onclick="deleteLeaveRecord(${index})" class="delete-button">删除</button>
                </td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
    `;
    listContainer.innerHTML = html;
}

/**
 * 渲染请假记录编辑器内容
 */
function renderLeaveRecordEditorContent() {
    const editor = document.getElementById('leave-editor');
    if (!editor) return;

    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    let teacherOptions = teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    let editorHtml = `
        <h5>新增请假记录</h5>
        <div>
            教师: <select id="new-leave-teacher-id" required>
                <option value="">请选择教师</option>
                ${teacherOptions}
            </select><br>
            请假类型:
            <select id="new-leave-type" required>
                <option value="事假">事假</option>
                <option value="病假">病假</option>
                <option value="年假">年假</option>
                <option value="婚假">婚假</option>
                <option value="产假">产假</option>
                <option value="丧假">丧假</option>
                <option value="其他">其他</option>
            </select><br>
            开始日期: <input type="date" id="new-leave-start-date" required><br>
            结束日期: <input type="date" id="new-leave-end-date" required><br>
            事由: <textarea id="new-leave-reason" rows="3" cols="30"></textarea><br>
            <button onclick="addLeaveRecord()">添加请假记录</button>
        </div>
        <hr>
        <h5>编辑请假记录 (点击列表中的“编辑”按钮)</h5>
        <div id="edit-leave-form">
            <!-- 编辑表单将在这里动态加载 -->
            <p>请在上方列表中选择一条记录进行编辑。</p>
        </div>
    `;
    editor.innerHTML = editorHtml;
    renderLeaveRecordList(); // 确保列表在编辑器下方显示
}

/**
 * 添加请假记录
 */
function addLeaveRecord() {
    const teacherId = document.getElementById('new-leave-teacher-id').value;
    const leaveType = document.getElementById('new-leave-type').value;
    const startDate = document.getElementById('new-leave-start-date').value;
    const endDate = document.getElementById('new-leave-end-date').value;
    const reason = document.getElementById('new-leave-reason').value.trim();

    if (!teacherId || !startDate || !endDate) {
        alert('请假教师、开始日期和结束日期为必填项。');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('开始日期不能晚于结束日期。');
        return;
    }

    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];
    const newRecord = {
        id: generateId('LR'),
        teacherId,
        leaveType,
        startDate,
        endDate,
        reason
    };
    leaveRecords.push(newRecord);
    saveData(STORAGE_KEYS.LEAVE_RECORDS, leaveRecords);

    alert('请假记录添加成功！');
    // 清空表单
    document.getElementById('new-leave-teacher-id').value = '';
    document.getElementById('new-leave-type').value = '事假';
    document.getElementById('new-leave-start-date').value = '';
    document.getElementById('new-leave-end-date').value = '';
    document.getElementById('new-leave-reason').value = '';

    renderLeaveRecordList();
    // 不需要重新渲染整个编辑器，只需刷新列表
}

/**
 * 编辑请假记录表单加载
 * @param {number} index - 请假记录在数组中的索引
 */
function editLeaveRecord(index) {
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const recordToEdit = leaveRecords[index];

    if (!recordToEdit) {
        alert('未找到要编辑的请假记录。');
        return;
    }

    let teacherOptions = teachers.map(t =>
        `<option value="${t.id}" ${t.id === recordToEdit.teacherId ? 'selected' : ''}>${t.name}</option>`
    ).join('');

    const leaveTypes = ['事假', '病假', '年假', '婚假', '产假', '丧假', '其他'];
    let leaveTypeOptions = leaveTypes.map(type =>
        `<option value="${type}" ${type === recordToEdit.leaveType ? 'selected' : ''}>${type}</option>`
    ).join('');

    const editFormHtml = `
        <h5>编辑请假记录</h5>
        <div>
            <input type="hidden" id="edit-leave-index" value="${index}">
            教师: <select id="edit-leave-teacher-id" required>
                ${teacherOptions}
            </select><br>
            请假类型:
            <select id="edit-leave-type" required>
                ${leaveTypeOptions}
            </select><br>
            开始日期: <input type="date" id="edit-leave-start-date" value="${recordToEdit.startDate}" required><br>
            结束日期: <input type="date" id="edit-leave-end-date" value="${recordToEdit.endDate}" required><br>
            事由: <textarea id="edit-leave-reason" rows="3" cols="30">${recordToEdit.reason || ''}</textarea><br>
            <button onclick="updateLeaveRecord()">保存修改</button>
            <button onclick="cancelEditLeaveRecord()">取消</button>
        </div>
    `;
    document.getElementById('edit-leave-form').innerHTML = editFormHtml;
}

/**
 * 更新请假记录
 */
function updateLeaveRecord() {
    const index = parseInt(document.getElementById('edit-leave-index').value, 10);
    const teacherId = document.getElementById('edit-leave-teacher-id').value;
    const leaveType = document.getElementById('edit-leave-type').value;
    const startDate = document.getElementById('edit-leave-start-date').value;
    const endDate = document.getElementById('edit-leave-end-date').value;
    const reason = document.getElementById('edit-leave-reason').value.trim();

    if (!teacherId || !startDate || !endDate) {
        alert('请假教师、开始日期和结束日期为必填项。');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert('开始日期不能晚于结束日期。');
        return;
    }

    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];
    if (index < 0 || index >= leaveRecords.length) {
        alert('无效的请假记录索引。');
        return;
    }

    leaveRecords[index] = {
        ...leaveRecords[index], // 保留ID等不变属性
        teacherId,
        leaveType,
        startDate,
        endDate,
        reason
    };
    saveData(STORAGE_KEYS.LEAVE_RECORDS, leaveRecords);

    alert('请假记录更新成功！');
    cancelEditLeaveRecord(); // 关闭编辑表单
    renderLeaveRecordList();
    calculateAndDisplayPayroll(); // 请假记录改变可能影响薪资，重新计算
}

/**
 * 取消编辑请假记录
 */
function cancelEditLeaveRecord() {
    document.getElementById('edit-leave-form').innerHTML = '<p>请在上方列表中选择一条记录进行编辑。</p>';
}

/**
 * 删除请假记录
 * @param {number} index - 请假记录在数组中的索引
 */
function deleteLeaveRecord(index) {
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];
    if (index < 0 || index >= leaveRecords.length) {
        alert('无效的请假记录索引。');
        return;
    }

    const recordToDelete = leaveRecords[index];
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const teacher = teachers.find(t => t.id === recordToDelete.teacherId);
    const teacherName = teacher ? teacher.name : '未知教师';

    if (confirm(`确定要删除教师 ${teacherName} 从 ${recordToDelete.startDate} 到 ${recordToDelete.endDate} 的请假记录吗？`)) {
        leaveRecords.splice(index, 1);
        saveData(STORAGE_KEYS.LEAVE_RECORDS, leaveRecords);
        alert('请假记录删除成功！');
        renderLeaveRecordList();
        cancelEditLeaveRecord(); // 如果删除的是当前编辑的记录，清空编辑表单
        calculateAndDisplayPayroll(); // 请假记录改变可能影响薪资，重新计算
    }
}


// --- 薪资计算与审批模块 UI (待完善) ---

/**
 * 根据调整金额更新最终薪资（仅UI显示）
 * @param {string} teacherId
 * @param {string} month - YYYY-MM格式
 */
function updateFinalSalary(teacherId, month) {
    const adjustmentInput = document.getElementById(`adj-${teacherId}`);
    const finalSalarySpan = document.getElementById(`final-salary-${teacherId}`);

    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const monthlySchedules = getData(STORAGE_KEYS.MONTHLY_SCHEDULES, {})[month] || [];
    const timeSlots = getData(STORAGE_KEYS.TIMESLOT_TYPES, []) || [];
    const leaveRecords = getData(STORAGE_KEYS.LEAVE_RECORDS, []) || [];

    let totalEffectiveMinutes = 0;
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, m - 1, day);

        // 检查当前教师当天是否有请假
        const isTeacherOnLeave = leaveRecords.some(record =>
            record.teacherId === teacher.id &&
            new Date(record.startDate) <= date &&
            new Date(record.endDate) >= date
        );

        const dayScheduleEntries = monthlySchedules.filter(entry =>
            entry.teacherId === teacher.id && entry.day === day
        );

        dayScheduleEntries.forEach(entry => {
            const slot = timeSlots.find(s => s.id === entry.timeSlotId);
            if (slot) {
                if (entry.isSubstitute && entry.substituteTeacherId === teacherId) {
                    // 如果当前教师是代班教师，则计入工时
                    totalEffectiveMinutes += slot.defaultDuration * slot.multiplier;
                } else if (!entry.isSubstitute && !isTeacherOnLeave) {
                    // 如果不是代班且原排班教师没有请假，则计入工时
                    totalEffectiveMinutes += slot.defaultDuration * slot.multiplier;
                }
            }
        });
    }

    const calculatedSalary = (totalEffectiveMinutes / 60) * teacher.defaultHourlyRate;
    const adjustment = parseFloat(adjustmentInput.value) || 0;
    const newFinalSalary = calculatedSalary + adjustment;
    finalSalarySpan.textContent = newFinalSalary.toFixed(2);
}

/**
 * 保存薪资单到localStorage
 * @param {string} teacherId
 * @param {string} month - YYYY-MM格式
 */
function savePayslip(teacherId, month) {
    const adjustment = parseFloat(document.getElementById(`adj-${teacherId}`).value) || 0;
    const finalSalary = parseFloat(document.getElementById(`final-salary-${teacherId}`).textContent);
    const status = document.getElementById(`status-${teacherId}`).textContent;

    const payslips = getData(STORAGE_KEYS.PAYSLIPS, {});
    if (!payslips[month]) {
        payslips[month] = {};
    }

    payslips[month][teacherId] = {
        adjustment: adjustment,
        finalSalary: finalSalary,
        status: status
    };

    saveData(STORAGE_KEYS.PAYSLIPS, payslips);
    alert('薪资单保存成功！');
    calculateAndDisplayPayroll();
}

/**
 * 确认薪资单
 * @param {string} teacherId
 * @param {string} month - YYYY-MM格式
 */
function confirmPayslip(teacherId, month) {
    if (!confirm('确定要确认这份薪资单吗？确认后将无法修改。')) {
        return;
    }

    const payslips = getData(STORAGE_KEYS.PAYSLIPS, {});
    if (payslips[month] && payslips[month][teacherId]) {
        payslips[month][teacherId].status = '已确认';
        saveData(STORAGE_KEYS.PAYSLIPS, payslips);
        alert('薪资单已确认！');
        calculateAndDisplayPayroll();
    } else {
        alert('薪资单不存在或已确认，无法再次确认。');
    }
}

/**
 * 切换每周固定排课设置区域的显示/隐藏
 * @param {HTMLElement} buttonElement - 触发点击的按钮元素
 * @param {string} teacherId - 教师ID
 */
function toggleScheduleSettings(buttonElement, teacherId) {
    const settingsDiv = document.getElementById(`weekly-schedule-settings-${teacherId}`);
    if (settingsDiv) {
        if (settingsDiv.style.display === 'none' || settingsDiv.style.display === '') {
            settingsDiv.style.display = 'block';
            buttonElement.textContent = '隐藏每周固定排课设置';
        } else {
            settingsDiv.style.display = 'none';
            buttonElement.textContent = '设置每周固定排课';
        }
    }
}

/**
 * 添加默认排课时段 (UI更新并准备保存)
 * @param {string} teacherId
 * @param {number} dayIndex - 星期几 (0-6)
 * @param {string} timeSlotId - 时段ID
 */
// addDefaultScheduleSlot 和 removeDefaultScheduleSlot 函数已不再需要，因为排课方式已改为复选框。
// 保留 saveWeeklyDefaultSchedule 函数，它现在从复选框读取数据。

/**
 * 保存指定教师的每周固定排课设置
 * 从UI收集数据，保存到localStorage，并刷新UI。
 * @param {string} teacherId - 要保存排课的教师ID
 */
function saveWeeklyDefaultSchedule(teacherId) {
    const teachers = getData(STORAGE_KEYS.TEACHERS, []) || [];
    const teacherIndex = teachers.findIndex(t => t.id === teacherId);

    if (teacherIndex === -1) {
        console.error(`Teacher with ID ${teacherId} not found for saving schedule.`);
        alert(`错误：找不到ID为 ${teacherId} 的教师`);
        return;
    }

    const teacher = teachers[teacherIndex];
    const newWeeklySchedule = {};

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayCheckboxesContainerId = `day-checkboxes-${teacher.id}-${dayIndex}`; // 使用 teacher.id 以保持一致性
        const dayCheckboxesContainer = document.getElementById(dayCheckboxesContainerId);
        
        if (dayCheckboxesContainer) {
            const selectedSlotsForDay = [];
            // 选择所有在该容器内被选中的复选框
            const checkedCheckboxes = dayCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
            
            checkedCheckboxes.forEach(checkbox => {
                selectedSlotsForDay.push(checkbox.value); // checkbox 的 value 就是 slotId
            });

            // 如果当天有选中的时段，则将其存入 newWeeklySchedule
            // 如果没有选中的时段 (selectedSlotsForDay 为空数组)，则不在 newWeeklySchedule 中为该 dayIndex 创建条目
            // 这将确保 teacher.weeklyDefaultSchedule 中只包含有排班的日期
            if (selectedSlotsForDay.length > 0) {
                newWeeklySchedule[dayIndex] = selectedSlotsForDay;
            }
        } else {
            // 如果容器不存在，记录一个警告，但不中断流程
            // 为安全起见，记录一个警告，但不中断流程
            console.warn(`Could not find day slots container: ${daySlotsContainerId} for teacher ${teacherId}.`);
        }
    }

    teacher.weeklyDefaultSchedule = newWeeklySchedule; // 用收集到的新排班替换旧的
    saveData(STORAGE_KEYS.TEACHERS, teachers);

    alert(`${teacher.name} 的每周固定排课已保存！`);

    // 重新渲染整个教师编辑区以确保所有内容（包括月度日历预览）都更新
    // 并且确保新保存的默认排班在UI上正确显示（如果之前是空的）
    renderTeacherEditorContent();
    
    // 用户要求保存后关闭，可以通过调用 toggleScheduleSettings 实现
    // 假设 toggleScheduleSettings 如果设置区是打开的，则会关闭它
    // 为了确保它关闭，我们可以传递一个指示关闭的参数，或者确保 toggle 的行为是这样的
    // 如果 toggleScheduleSettings 只是切换状态，那么如果它是打开的，调用一次就会关闭它。
    // 我们需要确保 toggleScheduleSettings(teacherId) 会关闭设置区域。
    // 查找 toggleScheduleSettings 的实现，它只是切换 style.display
    // 所以，如果它是打开的，调用一次就会关闭。
    const scheduleSettingsDiv = document.getElementById(`schedule-settings-${teacherId}`);
    if (scheduleSettingsDiv && scheduleSettingsDiv.style.display !== 'none') {
        toggleScheduleSettings(teacherId); // 调用一次以关闭
    }
}