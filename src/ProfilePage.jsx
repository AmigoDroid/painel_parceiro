/** Thin adapter: mantém sessão e transporte no painel parceiro. */
import SharedProfilePage from '@deltatv/ui/ProfilePage';
import { api, logout, updateAuthUser } from './api.js';
export default function ProfilePage(props) { return <SharedProfilePage variant="parceiro" api={api} logout={logout} updateAuthUser={updateAuthUser} {...props}/>; }
