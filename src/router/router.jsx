// src/router/router.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";
// Templates
import LoginForm from "../components/templates/login/LoginForm";
import Home from "../components/templates/home/Home";
import Welcome from "../components/templates/home/Welcome";
import Notifications from "../components/templates/notifications/Notifications";
import Answer from "../components/templates/answer/Answer";
import AnswerTicket from "../components/templates/answerTicket/AnswerTicket";
import TicketsContainer from "../components/templates/tickets/TicketsContainer";
import AddTicket from "../components/templates/addTicket/AddTicket";
import Reports from "../components/templates/reports/Reports";
// Modules
import SurveyList from "../components/modules/survey/SurveyList";
import AddSurvey from "../components/modules/survey/AddSurvey";
import SurveyDetail from "../components/modules/survey/SurveyDetail";
import SurveyResults from "../components/modules/survey/SurveyResults.jsx";
import TicketLifecycle from "../components/modules/ticket/TicketLifecycle";
// Common
import ProtectedRoute from "../components/common/ProtectedRoute";
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Welcome /> },
      { path: "tickets", element: <TicketsContainer /> }, // لیست تیکت‌ها
      { path: "tickets/add-ticket", element: <AddTicket /> },
      { path: "survey", element: <SurveyList /> }, // لیست نظرسنجی‌ها
      { path: "survey/add-survey", element: <AddSurvey /> }, // فرم افزودن نظرسنجی
      { path: "survey/:id", element: <SurveyDetail /> }, // جزئیات نظرسنجی
      { path: "notifications", element: <Notifications /> },
      { path: "notifications/survey/:id", element: <Answer /> },
      { path: "notifications/tickets/:id", element: <AnswerTicket /> },
      { path: "survey/results/:id", element: <SurveyResults /> },
      { 
        path: "reports", 
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "reports/ticket-lifecycle/:ticketId", 
        element: (
          <ProtectedRoute>
            <TicketLifecycle />
          </ProtectedRoute>
        ) 
      },
    ],
  },
]);
export default router;