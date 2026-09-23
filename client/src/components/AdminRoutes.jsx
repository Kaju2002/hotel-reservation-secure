import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import ManageEvents from "./admin/ManageEvents";
import ManageFoods from "./admin/ManageFoods";
import ManageOrders from "./admin/ManageOrders";
import ManagePackages from "./admin/ManagePackages";
import ManageParkings from "./admin/ManageParkings";
import ManageRooms from "./admin/ManageRooms";
import ManageEmployees from "./admin/ManageEmployees";
import ManageFeedbacks from "./admin/ManageFeedbacks";



function AdminRoutes() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="manage-events" element={<ManageEvents />} />
                <Route path="manage-foods" element={<ManageFoods />} />
                <Route path="manage-orders" element={<ManageOrders />} />
                <Route path="manage-packages" element={<ManagePackages />} />
                <Route path="manage-parkings" element={<ManageParkings />} />
                <Route path="manage-rooms" element={<ManageRooms />} />
                <Route path="manage-employees" element={<ManageEmployees />} />
                <Route path="manage-feedbacks" element={<ManageFeedbacks />} />
            </Routes>
        </div>
    );
}

export default AdminRoutes;
