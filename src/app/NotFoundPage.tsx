import { Link } from "react-router"

export function NotFoundPage(){
    return(
        <div>
            <h1>Page Not found</h1>
            <Link to="/cases">Return to cases</Link>
        </div>
    )
}