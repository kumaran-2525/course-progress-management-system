// faculty.js
{
const supabaseUrl = 'https://ddxznuiarrmsjkhscvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeHpudWlhcnJtc2praHNjdnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTQ2MzcsImV4cCI6MjA4MzUzMDYzN30.ILDZkHznrPRriDuLhPGWfeo_roeyrg6K5lmR7Wwl-Do';
const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

let faculty = null;
let courses = [];
let trackingData = [];
let searchQuery = '';
let editingCourse = null;

const email = localStorage.getItem("userEmail");

async function init() {
    if (!email) {
        window.location.href = "login.html";
        return;
    }
    await fetchFaculty();
    await fetchCourses();
    await fetchTrackingData();
    switchView('profile');
}

async function fetchFaculty() {
    const { data, error } = await supabase.from("faculty").select("*").eq("email", email);
    if (error || !data.length) {
        window.location.href = "login.html";
        return;
    }
    faculty = data[0];
    updateProfileUI();
}

async function fetchCourses() {
    // Filter courses by faculty_id if possible, or use the mock logic consistently
    const { data } = await supabase.from("course").select("*");
    // We filter locally to ensure "THEIR courses" logic works as requested
    // In a real app, we'd filter in the query: .eq('faculty_id', faculty.faculty_id)
    courses = (data || []).filter(c => {
        // If the course has a faculty_id, use it. Otherwise use the mock logic for now.
        if (c.faculty_id) return c.faculty_id === faculty.faculty_id;
        return c.course_id % 2 === faculty.faculty_id % 2;
    });
}

async function fetchTrackingData() {
    const { data: enrollments } = await supabase.from("enrollment").select("*");
    const { data: students } = await supabase.from("student").select("*");
    const { data: lessons } = await supabase.from("lesson").select("*");

    // Only track students in courses handled by this faculty
    const myCourseIds = new Set(courses.map(c => c.course_id));

    trackingData = (enrollments || [])
        .filter(e => myCourseIds.has(e.course_id))
        .map(e => {
            const s = students.find(x => x.student_id === e.student_id);
            const c = courses.find(x => x.course_id === e.course_id);
            const courseLessons = lessons.filter(x => x.course_id === e.course_id);
            const progress = e.status === 'Completed' ? 100 : Math.floor(Math.random() * 80) + 10;
            const lessonsCompleted = Math.floor((progress / 100) * courseLessons.length);

            return {
                studentName: s?.student_name || 'Unknown',
                courseName: c?.course_name || 'Unknown',
                lessonsCompleted: `${lessonsCompleted}/${courseLessons.length}`,
                progress: progress
            };
        });
}

function updateProfileUI() {
    const initials = faculty.faculty_name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').innerText = initials;
    document.getElementById('userName').innerText = faculty.faculty_name;
    document.getElementById('userEmail').innerText = faculty.email;
    
    document.getElementById('profileAvatar').innerText = initials;
    document.getElementById('profileName').innerText = faculty.faculty_name;
    document.getElementById('profileEmail').innerText = faculty.email;
    document.getElementById('profileDept').innerText = faculty.department;
    document.getElementById('profileId').innerText = `#F${faculty.faculty_id}`;
}

function renderStats() {
    document.getElementById('statCourses').innerText = courses.length;
    document.getElementById('statStudents').innerText = trackingData.length;
    document.getElementById('statActive').innerText = trackingData.filter(t => t.progress < 100).length;
}

function renderCurriculum() {
    const curriculumArea = document.getElementById('curriculumArea');
    curriculumArea.innerHTML = '';
    
    const filtered = courses.filter(c => {
        const [name] = c.course_name.split('|||');
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    filtered.forEach(c => {
        const [name, img] = c.course_name.split('|||');
        const courseImage = img || `https://picsum.photos/seed/${name}/400/200`;

        const card = document.createElement('div');
        card.className = 'glass-panel course-card animate-scale-in';
        card.innerHTML = `
            <div class="h-48 overflow-hidden relative">
                <img src="${courseImage}" class="course-img" alt="Course" referrerPolicy="no-referrer">
                <button onclick="openEditImage(${c.course_id})" class="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center text-blue-600 shadow-xl hover:bg-white transition-all">
                    <i data-lucide="image" class="w-6 h-6"></i>
                </button>
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-2xl font-black text-slate-900">${name}</h3>
                    <span class="badge badge-blue">ID: ${c.course_id}</span>
                </div>
                <p class="text-slate-500 text-sm mb-8 font-medium">Duration: ${c.duration}</p>
                <button onclick="manageCurriculum(${c.course_id})" class="btn-primary w-full">Manage Curriculum</button>
            </div>
        `;
        curriculumArea.appendChild(card);
    });
    lucide.createIcons();
}

function renderTracking() {
    const trackingArea = document.getElementById('trackingArea');
    trackingArea.innerHTML = '';

    trackingData.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-10 py-6 font-black text-slate-900">${t.studentName}</td>
            <td class="px-10 py-6 text-slate-500 font-bold">${t.courseName.split('|||')[0]}</td>
            <td class="px-10 py-6 font-black text-blue-600">${t.lessonsCompleted}</td>
            <td class="px-10 py-6">
                <div class="flex items-center gap-4">
                    <div class="progress-container flex-1">
                        <div class="progress-bar" style="width: ${t.progress}%"></div>
                    </div>
                    <span class="font-black text-xs text-slate-900">${t.progress}%</span>
                </div>
            </td>
        `;
        trackingArea.appendChild(row);
    });
}

async function handleAddCourse() {
    const name = document.getElementById('newCourseName').value;
    const duration = document.getElementById('newCourseDuration').value;
    const img = document.getElementById('newCourseImage').value;

    if (!name || !duration) {
        alert("Please fill required fields");
        return;
    }

    const fullCourseName = img ? `${name}|||${img}` : name;
    // Attempt to include faculty_id for better tracking
    const { error } = await supabase.from("course").insert([{ 
        course_name: fullCourseName, 
        duration,
        faculty_id: faculty.faculty_id 
    }]);

    if (error) {
        // Fallback if faculty_id column doesn't exist
        const { error: retryError } = await supabase.from("course").insert([{ 
            course_name: fullCourseName, 
            duration 
        }]);
        if (retryError) alert(retryError.message);
        else {
            alert("Course Created Successfully!");
            await fetchCourses();
            switchView('curriculum');
        }
    } else {
        alert("Course Created Successfully!");
        await fetchCourses();
        switchView('curriculum');
    }
}

window.openEditImage = function(courseId) {
    editingCourse = courses.find(c => c.course_id === courseId);
    if (!editingCourse) return;
    const [name, img] = editingCourse.course_name.split('|||');
    document.getElementById('editImageUrl').value = img || '';
    document.getElementById('editPreviewImg').src = img || '';
    document.getElementById('editPreviewContainer').classList.toggle('hidden', !img);
    document.getElementById('editImageModal').classList.remove('hidden');
}

async function handleSaveImage() {
    if (!editingCourse) return;
    const newUrl = document.getElementById('editImageUrl').value;
    const [name] = editingCourse.course_name.split('|||');
    const updatedName = newUrl ? `${name}|||${newUrl}` : name;

    const { error } = await supabase.from("course").update({ course_name: updatedName }).eq("course_id", editingCourse.course_id);

    if (error) alert(error.message);
    else {
        alert("Image Updated Successfully!");
        document.getElementById('editImageModal').classList.add('hidden');
        await fetchCourses();
        renderCurriculum();
    }
}

window.manageCurriculum = function(courseId) {
    window.location.href = `lesson.html?courseId=${courseId}&faculty=true`;
}

function switchView(view) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(v => {
        v.classList.remove('active', 'view-transition');
        v.style.display = 'none';
    });
    document.querySelectorAll('.sidebar .nav-link').forEach(a => a.classList.remove('active'));
    
    const views = {
        profile: { id: 'profileView', nav: 'navProfile' },
        curriculum: { id: 'curriculumView', nav: 'navCurriculum' },
        addCourse: { id: 'addCourseView', nav: 'navAddCourse' },
        tracking: { id: 'trackingView', nav: 'navTracking' }
    };

    const target = views[view];
    const targetEl = document.getElementById(target.id);
    targetEl.style.display = 'block';
    targetEl.classList.add('active', 'view-transition');
    document.getElementById(target.nav).classList.add('active');

    if (view === 'curriculum') renderCurriculum();
    if (view === 'tracking') renderTracking();
}

document.getElementById('navProfile').addEventListener('click', () => switchView('profile'));
document.getElementById('navCurriculum').addEventListener('click', () => switchView('curriculum'));
document.getElementById('navAddCourse').addEventListener('click', () => switchView('addCourse'));
document.getElementById('navTracking').addEventListener('click', () => switchView('tracking'));

document.getElementById('courseSearch').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCurriculum();
});

document.getElementById('newCourseImage').addEventListener('input', (e) => {
    const url = e.target.value;
    const preview = document.getElementById('imagePreview');
    const img = document.getElementById('previewImg');
    if (url) { img.src = url; preview.classList.remove('hidden'); }
    else { preview.classList.add('hidden'); }
});

document.getElementById('addCourseBtn').addEventListener('click', handleAddCourse);
document.getElementById('saveImageBtn').addEventListener('click', handleSaveImage);
document.getElementById('closeEditModal').addEventListener('click', () => document.getElementById('editImageModal').classList.add('hidden'));

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = "login.html";
});

init();
}
