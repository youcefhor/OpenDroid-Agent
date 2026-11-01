import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'OpenDroid Nexus — Agents that leave evidence',description:'Create agents, run evidence workflows and retain verified source reports. Arabic-first open-source agent workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
