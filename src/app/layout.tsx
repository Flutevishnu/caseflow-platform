import { Outlet, NavLink } from "react-router"
import "./layout.css"

export function Layout(){
    return(
        <div className="layout">
            <a className="skip" href="#main-content">Skip to content</a>
            <header className="header">
                <span className="brand">CaseFlow</span>
                <nav aria-label="Main" className="nav">
                    <NavLink to="/cases" end>Cases</NavLink>
                    <NavLink to="/cases/new">New case</NavLink>
                </nav>
            </header>
            <main id="main-content" className="main">
                <Outlet />
            </main>
        </div>
    )
}
