/** Adapter do painel parceiro: transporte e sessão não são compartilhados. */
import ClientApps from '@deltatv/ui/ClientApps';
import SharedWhiteLabelApps from '@deltatv/ui/WhiteLabelApps';
import { api } from './api.js';
export default function WhiteLabelApps(props) { return <ClientApps {...props} api={api} whiteLabel={<SharedWhiteLabelApps api={api} />} onUpgrade={() => window.location.hash = '#/plans'} />; }
