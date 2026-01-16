import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportViewer } from '../components/ReportViewer';
import '../styles/Reports.css';

const queryClient = new QueryClient();

export function Reports() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="reports-page">
                <div className="page-header">
                    <h1>Compliance Reports</h1>
                    <p>View and download compliance run reports with detailed hire information</p>
                </div>

                <ReportViewer />
            </div>
        </QueryClientProvider>
    );
}
