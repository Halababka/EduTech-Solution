import { useState } from "#app";
import { useUser } from "~/composables/user";
import { fetchCourse } from "~/helpers/courses";

const runtimeConfig = useRuntimeConfig();


export const useCourses = async (force = false) => {
    const courses = useState("courses", () => {
    });

    if (!courses.value || force) {
        courses.value = await initCourses();
    }

    return courses;
};

export const initCourses = async () => {
    const user = (await useUser()).value;
    const courses = {
        coursesData: [],
        pending: [],
        error: [],
        refresh: []
    };

    if (useCookie("token").value) {
        try {
            const {
                data: coursesData,
                pending,
                error,
                refresh
            } = useFetch(`${runtimeConfig.public.apiBase}/users/${user.userData.id}/courses`, {
                onRequest({request, options}) {
                    options.headers = options.headers || {};
                    options.headers.authorization = useCookie("token").value;
                }
            });
            console.log("Сработала запрос на сервер courses");
            courses.coursesData = coursesData;
            courses.pending = pending;
            courses.error = error;
            courses.refresh = refresh;

        } catch (err) {
            console.error(err);
        }
    }

    return courses;
};

export const useEditingCourse = (serverData = null) => {
    const initialState = {
        name: "Без названия",
        imageUrl: null,
        description: "",
        startDate: "",
        endDate: "",
        categories: [],
        isActive: true,
        duration_hours: null,
        enrolledStudents: [],
        courseOwners: [],
        sections: [
            {name: "Введение", open: true, contents: [], editing: false, subsections: []},
            {name: "Секция 1", open: false, contents: [], editing: false, subsections: []},
            {name: "Секция 2", open: false, contents: [], editing: false, subsections: []},
            {name: "Секция 3", open: false, contents: [], editing: false, subsections: []},
            {name: "Секция 4", open: false, contents: [], editing: false, subsections: []},
            {name: "Секция 5", open: false, contents: [], editing: false, subsections: []}
        ]
    };

    const transformServerData = (data) => {
        return {
            name: data.name,
            imageUrl: data.image_url,
            description: data.description,
            startDate: data.starts_at,
            endDate: data.ends_at,
            categories: data.categories.map(cat => cat.name),
            isActive: data.active,
            duration_hours: data.duration_hours,
            enrolledStudents: data.enrolled_students,
            courseOwners: data.course_owners,
            sections: data.sections.map(section => ({
                name: section.name,
                open: false,  // Default to false, except for "Введение"
                contents: section.section_content || [],
                editing: false,
                subsections: section.subsections ? section.subsections.map(subsection => ({
                    name: subsection.name,
                    open: false,
                    contents: subsection.section_content || [],
                    editing: false
                })) : []
            }))
        };
    };
    const state = useState("editingCourse", () => serverData ? transformServerData(serverData) : initialState);
    return state;
};

export const transformServerData = (data) => {
    // data.starts_at = data.starts_at ? data.starts_at.split("T")[0] : null;
    // data.ends_at = data.ends_at ? data.ends_at.split("T")[0] : null;
    return {
        name: data.name,
        imageUrl: data.image_url,
        description: data.description,
        startDate: data.starts_at,
        endDate: data.ends_at,
        categories: data.categories,
        isActive: data.active,
        duration_hours: data.duration_hours,
        enrolledStudents: data.enrolled_students,
        courseOwners: data.course_owners,
        sections: data.sections.map(section => ({
            name: section.name,
            open: true,  // Default to false, except for "Введение"
            contents: section.section_content || [],
            editing: false,
            subsections: section.subsections ? section.subsections.map(subsection => ({
                name: subsection.name,
                open: true,
                contents: subsection.section_content || [],
                editing: false
            })) : []
        }))
    };
};

export const initialState = {
    name: "Без названия",
    imageUrl: null,
    description: "",
    startDate: "",
    endDate: "",
    categories: [],
    isActive: true,
    duration_hours: null,
    enrolledStudents: [],
    courseOwners: [],
    sections: [
        {name: "Введение", open: true, contents: [], editing: false, subsections: []},
        {name: "Секция 1", open: false, contents: [], editing: false, subsections: []},
        {name: "Секция 2", open: false, contents: [], editing: false, subsections: []},
        {name: "Секция 3", open: false, contents: [], editing: false, subsections: []},
        {name: "Секция 4", open: false, contents: [], editing: false, subsections: []},
        {name: "Секция 5", open: false, contents: [], editing: false, subsections: []}
    ]
};

export const useEditingCourseId = async (id = null, force = false) => {
    const courseId = useState("courseId", () => {});

    if(courseId.value) console.log("courseId.value.id",courseId.value.id)

    if (!courseId.value || force || id) {
        console.log("OK")
        try {
            const response = await fetchCourse(id);
            if (response) {
                courseId.value = await initCourseId(response);
            }
        } catch (error) {
            console.error("Failed to load course data:", error);
        }
    }

    return courseId;
};

export const initCourseId = async (data = null) => {
    if (data) {
        data.starts_at = data.starts_at ? data.starts_at.slice(0, -5) : null;
        data.ends_at = data.ends_at ? data.ends_at.slice(0, -5) : null;
    }
    console.log("data23",data)
    return {
        id: data.id,
        name: data.name,
        imageUrl: data.image_url,
        description: data.description,
        startDate: data.starts_at,
        endDate: data.ends_at,
        categories: data.categories,
        isActive: data.active,
        duration_hours: data.duration_hours,
        enrolledStudents: data.enrolled_students,
        courseOwners: data.course_owners,
        sections: data.sections.map(section => ({
            id: section.id,
            name: section.name,
            open: true,
            contents: section.section_content || [],
            editing: false,
            subsections: section.subsections ? section.subsections.map(subsection => ({
                id: subsection.id,
                name: subsection.name,
                open: true,
                contents: subsection.section_content || [],
                editing: false
            })) : []
        }))
    };
};