/** Adapter do painel parceiro: transporte e sessão não são compartilhados. */
import SharedWhiteLabelApps from '@deltatv/ui/WhiteLabelApps';
import { api } from './api.js';
export default function WhiteLabelApps(props) { return <SharedWhiteLabelApps {...props} api={api} />; }
