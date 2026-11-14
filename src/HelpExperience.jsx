/** Adapter do painel parceiro: transporte e sessão não são compartilhados. */
import SharedHelpExperience from '@deltatv/ui/HelpExperience';
import { api } from './api.js';
export default function HelpExperience(props) { return <SharedHelpExperience {...props} api={api} />; }
