import { Route, Routes } from 'react-router-dom';
import ActivityTrackingPage from '../pages/ActivityTrackingPage';
import AdvancedCourseSystemPage from '../pages/AdvancedCourseSystemPage';
import AiCoachPage from '../pages/AiCoachPage';
import AdminCourseBuilderPage from '../pages/AdminCourseBuilderPage';
import AdminCourseListPage from '../pages/AdminCourseListPage';
import AreaSelectPage from '../pages/AreaSelectPage';
import CharacterCreation from '../pages/CharacterCreation';
import CharacterDashboardPage from '../pages/CharacterDashboardPage';
import CharacterSelectPage from '../pages/CharacterSelectPage';
import CommunityPage from '../pages/CommunityPage';
import CourseBuilder from '../pages/CourseBuilder';
import CourseDetailPage from '../pages/CourseDetailPage';
import CourseViralHubPage from '../pages/CourseViralHubPage';
import ExplorationMapPage from '../pages/ExplorationMapPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import QuestCompletedPage from '../pages/QuestCompletedPage';
import RegisterPage from '../pages/RegisterPage';
import RewardsPage from '../pages/RewardsPage';
import BgcTestModePage from '../pages/BgcTestModePage';

export const appRoutes = (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/character" element={<CharacterSelectPage />} />
    <Route path="/character/create" element={<CharacterCreation />} />
    <Route path="/character-dashboard" element={<CharacterDashboardPage />} />
    <Route path="/areas" element={<AreaSelectPage />} />
    <Route path="/map" element={<ExplorationMapPage />} />
    <Route path="/coach" element={<AiCoachPage />} />
    <Route path="/community" element={<CommunityPage />} />
    <Route path="/course-builder" element={<CourseBuilder />} />
    <Route path="/course-builder/:courseId" element={<CourseBuilder />} />
    <Route path="/advanced-courses" element={<AdvancedCourseSystemPage />} />
    <Route path="/test-mode/bgc" element={<BgcTestModePage />} />
    <Route path="/course-viral" element={<CourseViralHubPage />} />
    <Route path="/courses/:courseId" element={<CourseDetailPage />} />
    <Route path="/run" element={<ActivityTrackingPage />} />
    <Route path="/activity/:courseId" element={<ActivityTrackingPage />} />
    <Route path="/completed/:courseId" element={<QuestCompletedPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/rewards" element={<RewardsPage />} />
    <Route path="/admin/course-builder" element={<AdminCourseBuilderPage />} />
    <Route path="/admin/courses" element={<AdminCourseListPage />} />
  </Routes>
);
