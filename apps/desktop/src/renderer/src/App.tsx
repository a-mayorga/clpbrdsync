import { Dashboard } from "./features/dashboard/dashboard";
import { QuickPaste } from "./features/quick-paste/quick-paste";
import { getRendererWindowType } from "./window-type";

function App(): React.JSX.Element {
  const windowType = getRendererWindowType();

  switch (windowType) {
    case "quick-paste":
      return <QuickPaste />;

    case "main":
      return <Dashboard />;
  }
}

export default App;
