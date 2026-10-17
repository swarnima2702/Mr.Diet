import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedRouteProps) => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = () => {
            const user = localStorage.getItem("mrdiet_auth_user");

            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                const userData = JSON.parse(user);
                // Check if user has is_admin flag
                setIsAdmin(userData.is_admin === 1 || userData.is_admin === "1" || userData.is_admin === true);
            } catch {
                setIsAdmin(false);
            }

            setLoading(false);
        };

        checkAdminStatus();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin/auth" replace />;
    }

    return <>{children}</>;
};

export default ProtectedAdminRoute;
