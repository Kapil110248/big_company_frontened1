import api from "./apiService";

export const employeeService = {
  // Get all employees (Admin)
  getEmployees: async () => {
    const response = await api.get("/admin/employees");
    return response.data;
  },

  // Create employee
  createEmployee: async (data: any) => {
    const response = await api.post("/admin/employees", data);
    return response.data;
  },

  // Update employee
  updateEmployee: async (id: string, data: any) => {
    const response = await api.put(`/admin/employees/${id}`, data);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    const response = await api.delete(`/admin/employees/${id}`);
    return response.data;
  },

  // Attendance
  getAttendance: async () => {
    const response = await api.get("/employee/attendance");
    return response.data;
  },

  getAttendanceById: async (id: string) => {
    const response = await api.get(`/employee/attendance/${id}`);
    return response.data;
  },

  checkIn: async (location?: string) => {
    const response = await api.post("/employee/check-in", { location });
    return response.data;
  },

  checkOut: async () => {
    const response = await api.post("/employee/check-out", {});
    return response.data;
  },

  // Leave
  getLeaves: async () => {
    const response = await api.get("/employee/leaves");
    return response.data;
  },

  requestLeave: async (data: any) => {
    const response = await api.post("/employee/leaves", data);
    return response.data;
  },

  // Bill Payments
  getBillPayments: async () => {
    console.log("DEBUG: Calling getBillPayments API");
    const response = await api.get("/employee/bill-payments");
    return response.data;
  },

  addBillPayment: async (data: any) => {
    console.log("DEBUG: Calling addBillPayment API", data);
    const response = await api.post("/employee/bill-payments", data);
    return response.data;
  },

  updateBillPayment: async (id: string, data: any) => {
    const response = await api.put(`/employee/bill-payments/${id}`, data);
    return response.data;
  },

  deleteBillPayment: async (id: string) => {
    const response = await api.delete(`/employee/bill-payments/${id}`);
    return response.data;
  },

  // Projects
  getProjects: async () => {
    const response = await api.get("/employee/projects");
    return response.data;
  },

  getProjectById: async (id: string) => {
    const response = await api.get(`/employee/projects/${id}`);
    return response.data;
  },

  // Tasks
  getTasks: async () => {
    const response = await api.get("/employee/tasks");
    return response.data;
  },

  updateTaskStatus: async (id: string, data: any) => {
    const response = await api.put(`/employee/tasks/${id}`, data);
    return response.data;
  },

  // Training
  getCourses: async () => {
    const response = await api.get("/employee/training/courses");
    return response.data;
  },

  getCourseById: async (id: string) => {
    const response = await api.get(`/employee/training/courses/${id}`);
    return response.data;
  },

  enrollCourse: async (courseId: string) => {
    const response = await api.post(`/employee/training/courses/${courseId}/enroll`);
    return response.data;
  },

  updateLessonProgress: async (lessonId: string) => {
    const response = await api.put(`/employee/training/lessons/${lessonId}/complete`);
    return response.data;
  },

  getCertificates: async () => {
    const response = await api.get("/employee/training/certificates");
    return response.data;
  },
};
