import { Outlet, NavLink } from "react-router"

export function Layout(){
    return(
        <div>
            <nav>
                <NavLink to="/cases">Cases</NavLink>
                <NavLink to="/cases/new">New Cases</NavLink>
            </nav>

            <Outlet />
        </div>
    )
}