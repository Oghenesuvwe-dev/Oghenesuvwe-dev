import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';
import Hero from './components/Hero';
import Banner from './components/Banner';
import GitHubActivityChart from './components/GitHubActivityChart';

const Navbar = lazy(() => import('./components/Navbar'));
const About = lazy(() => import('./components/About'));
const Experience = lazy(() => import('./components/Experience'));
const Projects = lazy(() => import('./components/Projects'));
const Skills = lazy(() => import('./components/Skills'));
const Certifications = lazy(() => import('./components/Certifications'));
const Badges = lazy(() => import('./components/Badges'));
const Contact = lazy(() => import('./components/Contact'));

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Navbar />
          <Banner />
          <main className="pt-16">
            <Hero />
            <About />
            <Projects />
            <GitHubActivityChart />
            <Experience />
            <Skills />
            <Certifications />
            <Badges />
            <Contact />
          </main>
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default App;
