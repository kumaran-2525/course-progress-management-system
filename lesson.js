// lesson.js
{
const supabaseUrl = 'https://ddxznuiarrmsjkhscvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeHpudWlhcnJtc2praHNjdnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTQ2MzcsImV4cCI6MjA4MzUzMDYzN30.ILDZkHznrPRriDuLhPGWfeo_roeyrg6K5lmR7Wwl-Do';
const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

const urlParams = new URLSearchParams(window.location.search);
const courseId = parseInt(urlParams.get('courseId'));
const isFaculty = urlParams.get('faculty') === 'true';

let course = null;
let lessons = [];
let activeLessonId = null;
let editingLesson = null;

const email = localStorage.getItem("userEmail");

async function init() {
    if (!email || !courseId) {
        window.location.href = "login.html";
        return;
    }
    await fetchCourse();
    await fetchLessons();
    setupUI();
}

async function fetchCourse() {
    const { data } = await supabase.from("course").select("*").eq("course_id", courseId);
    if (data && data.length) {
        course = data[0];
        const [name, img] = course.course_name.split('|||');
        document.getElementById('courseTitle').innerText = `${name} ${isFaculty ? 'Curriculum' : ''}`;
        if (img) {
            document.getElementById('bgOverlay').style.backgroundImage = `url("${img}")`;
        }
    }
}

async function fetchLessons() {
    const { data } = await supabase.from("lesson").select("*").eq("course_id", courseId).order("lesson_order", { ascending: true });
    lessons = data || [];
    renderLessonList();
}

function setupUI() {
    if (isFaculty) {
        document.getElementById('facultyForm').classList.remove('hidden');
        document.getElementById('backBtn').addEventListener('click', () => window.location.href = "faculty-dashboard.html");
    } else {
        document.getElementById('completeCourseBtnContainer').classList.remove('hidden');
        document.getElementById('backBtn').addEventListener('click', () => window.location.href = "student-dashboard.html");
    }
}

function renderLessonList() {
    const lessonList = document.getElementById('lessonList');
    lessonList.innerHTML = '';

    lessons.forEach(l => {
        const [title, , type] = l.lesson_title.split("|||");
        const isActive = activeLessonId === l.lesson_id;
        
        const item = document.createElement('div');
        item.className = `glass-panel p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-white/90 ${isActive ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-lg' : ''}`;
        item.onclick = () => selectLesson(l.lesson_id);
        
        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}">
                    <i data-lucide="${type === 'video' ? 'video' : type === 'image' ? 'image' : 'file-text'}" class="w-5 h-5"></i>
                </div>
                <span class="font-black text-sm tracking-tight">${title}</span>
            </div>
            ${isFaculty ? `
                <div class="flex gap-2">
                    <button onclick="event.stopPropagation(); editLesson(${l.lesson_id})" class="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteLesson(${l.lesson_id})" class="p-2 hover:bg-red-50 rounded-xl text-red-500">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            ` : ''}
        `;
        lessonList.appendChild(item);
    });
    lucide.createIcons();
}

window.selectLesson = function(lessonId) {
    activeLessonId = lessonId;
    renderLessonList();
    renderPreview();
}

function renderPreview() {
    const lesson = lessons.find(l => l.lesson_id === activeLessonId);
    if (!lesson) {
        document.getElementById('lessonPreview').classList.add('hidden');
        document.getElementById('noLessonSelected').classList.remove('hidden');
        return;
    }

    document.getElementById('noLessonSelected').classList.add('hidden');
    document.getElementById('lessonPreview').classList.remove('hidden');

    const [title, content, type, img] = lesson.lesson_title.split("|||");
    document.getElementById('previewTitle').innerText = title;
    
    const illustration = document.getElementById('previewIllustration');
    if (img) {
        illustration.src = img;
        illustration.classList.remove('hidden');
    } else {
        illustration.classList.add('hidden');
    }

    const contentBox = document.getElementById('previewContentBox');
    contentBox.innerHTML = '';

    if (type === 'video') {
        const embedUrl = content.includes('youtube.com') ? content.replace('watch?v=', 'embed/') : content;
        contentBox.innerHTML = `
            <div class="relative pb-[56.25%] h-0 overflow-hidden rounded-[2.5rem] bg-black shadow-2xl">
                <iframe src="${embedUrl}" class="absolute top-0 left-0 w-full h-full" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    } else if (type === 'image') {
        contentBox.innerHTML = `<img src="${content}" class="w-full rounded-[2.5rem] shadow-2xl">`;
    } else {
        contentBox.innerHTML = `<div class="whitespace-pre-wrap text-slate-700 text-xl font-medium leading-relaxed">${content}</div>`;
    }
}

async function handleSaveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const type = document.getElementById('lessonType').value;
    const content = document.getElementById('lessonContent').value;
    const img = document.getElementById('lessonImg').value;

    if (!title || !content) {
        alert("Please fill required fields");
        return;
    }

    const fullTitle = `${title}|||${content}|||${type}|||${img}`;

    if (editingLesson) {
        const { error } = await supabase.from("lesson")
            .update({ lesson_title: fullTitle })
            .eq("lesson_id", editingLesson.lesson_id);
        if (error) alert(error.message);
        else {
            alert("Lesson Updated!");
            cancelEdit();
            await fetchLessons();
        }
    } else {
        const { error } = await supabase.from("lesson").insert([{
            course_id: courseId,
            lesson_title: fullTitle,
            lesson_order: lessons.length + 1
        }]);
        if (error) alert(error.message);
        else {
            alert("Lesson Added!");
            clearForm();
            await fetchLessons();
        }
    }
}

window.editLesson = function(lessonId) {
    editingLesson = lessons.find(l => l.lesson_id === lessonId);
    if (!editingLesson) return;

    const [title, content, type, img] = editingLesson.lesson_title.split("|||");
    document.getElementById('lessonTitle').value = title;
    document.getElementById('lessonType').value = type;
    document.getElementById('lessonContent').value = content;
    document.getElementById('lessonImg').value = img || '';
    
    document.getElementById('formTitle').innerText = 'Edit Lesson Unit';
    document.getElementById('saveLessonBtn').innerText = 'Update Lesson';
    document.getElementById('cancelEditBtn').classList.remove('hidden');
}

function cancelEdit() {
    editingLesson = null;
    clearForm();
    document.getElementById('formTitle').innerText = 'Add New Lesson Unit';
    document.getElementById('saveLessonBtn').innerText = 'Save Lesson';
    document.getElementById('cancelEditBtn').classList.add('hidden');
}

function clearForm() {
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonContent').value = '';
    document.getElementById('lessonImg').value = '';
}

window.deleteLesson = async function(lessonId) {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    const { error } = await supabase.from("lesson").delete().eq("lesson_id", lessonId);
    if (error) alert(error.message);
    else {
        alert("Lesson Deleted!");
        await fetchLessons();
    }
}

async function handleCompleteCourse() {
    const { data: studentData } = await supabase.from("student").select("student_id").eq("email", email);
    if (!studentData || !studentData.length) return;
    
    const studentId = studentData[0].student_id;
    const { error } = await supabase.from("enrollment")
        .update({ status: 'Completed' })
        .eq("student_id", studentId)
        .eq("course_id", courseId);
    
    if (error) alert(error.message);
    else {
        alert("Course status updated to: Completed");
        window.location.href = "student-dashboard.html";
    }
}

document.getElementById('saveLessonBtn').addEventListener('click', handleSaveLesson);
document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
document.getElementById('completeCourseBtn').addEventListener('click', handleCompleteCourse);

init();
}
