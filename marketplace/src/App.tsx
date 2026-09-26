import { HashRouter, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileTabBar } from './components/MobileTabBar';
import { RequireAuth } from './components/RequireAuth';
import { ScrollToTop } from './components/ScrollToTop';
import { Toast } from './components/Toast';
import { AppProvider } from './context/AppContext';
import { AccountPage } from './pages/AccountPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { HomePage } from './pages/HomePage';
import { ListingPage } from './pages/ListingPage';
import { LocationsPage } from './pages/LocationsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostPage } from './pages/PostPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { SellerPage } from './pages/SellerPage';

// HashRouter keeps deep links working on any static host (no server rewrites).
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Header />
        <main id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/c/:cat" element={<SearchPage />} />
            <Route path="/c/:cat/:sub" element={<SearchPage />} />
            <Route path="/l/:province" element={<SearchPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/listing/:id" element={<ListingPage />} />
            <Route path="/seller/:id" element={<SellerPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/post" element={<RequireAuth><PostPage /></RequireAuth>} />
            <Route path="/edit/:id" element={<RequireAuth><PostPage /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/account/:tab" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <MobileTabBar />
        <Toast />
      </HashRouter>
    </AppProvider>
  );
}
