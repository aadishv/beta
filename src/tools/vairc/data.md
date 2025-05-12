# Appendix: Dashboard code

Following is all of our code for our VEX AI dashboard.
This was written as part of a team member's [website](aadishv.github.io). It uses the following technologies:

* React, a JavaScript library for building interactive, component-based Web UIs
* Astro, a Server-Side Rendering framework that React is used with to improve site performance
* TailwindCSS, a styling solution to simplify our layouts
* shadcn/ui, a component library built on top of TailwindCSS that provides good default components (such as buttons and cards)
* React Mosaic, a library for building drag-and-drop, window management-style experiences
* TypeScript, a superset of JavaScript that adds strict typing behaviors to decrease the amounts of errors

aadishv.github.io/src/tools/vairc
```tsx aadishv.github.io/src/tools/vairc/App.tsx
// aadishv.github.io/src/components/vairc/App.tsx
import React from "react";
import { Layout } from "./Layout";
import { ColorFeed, DepthFeed, BackCamera } from "./components/Feeds";
import { JsonRenderer } from "./components/InfoPanels";
import DetailsPanel from "./components/DetailsPanel";
import FieldView from "./components/FieldView";
import 'react-mosaic-component/react-mosaic-component.css';
import './app.css';

// Create the map of window IDs to components
const windowComponents = {
  1: ColorFeed,
  2: DepthFeed,
  3: JsonRenderer,
  4: BackCamera,
  5: DetailsPanel,
  6: FieldView,
};

// Create the map of window IDs to titles
const windowTitles = {
  1: "Color Feed",
  2: "Depth Feed",
  3: "Raw Data",
  4: "Back Camera",
  5: "Details",
  6: "Field View"
};

// Main App Component
export default function VAIRCApp() {
  return (
    <Layout windowComponents={windowComponents} windowTitles={windowTitles} />
  );
}
```

```tsx aadishv.github.io/src/tools/vairc/Layout.tsx
// aadishv.github.io/src/components/vairc/Layout.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Mosaic,
  MosaicWindow,
  MosaicZeroState,
  createBalancedTreeFromLeaves,
  type MosaicNode,
  type MosaicBranch
} from 'react-mosaic-component';

import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { AlertCircle, Settings, RotateCw } from 'lucide-react';

import 'react-mosaic-component/react-mosaic-component.css';
import './app.css';

// Default server configuration
export const DEFAULT_SERVER = "192.168.86.98:5000";

// Interfaces
type WindowComponentMap = Record<number, React.ComponentType<any>>;
type WindowTitleMap = Record<number, string>;

export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
  depth?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

export interface Pose {
  x: number;
  y: number;
  theta: number;
}

export interface JetsonStats {
  cpu_temp: number;
  gpu_temp: number;
  uptime: number;
}

export interface DetectionPayload {
  stuff: Detection[];
  pose?: Pose;
  flag?: string;
  jetson?: JetsonStats;
}

interface WindowProps {
  path: MosaicBranch[];
  component: React.ComponentType<any>;
  title: string;
  latestDetections: DetectionPayload | null;
  serverConfig: string;
}

interface LayoutProps {
  windowComponents: WindowComponentMap;
  windowTitles?: WindowTitleMap;
}

// SSE Hook for detection data
export function useSSEDetections(
    server: string,
    endpoint: string = "events",
    initialValue: DetectionPayload | null = null
): { detections: DetectionPayload | null, connectionError: boolean } {
    const [detections, setDetections] = useState<DetectionPayload | null>(initialValue);
    const [connectionError, setConnectionError] = useState<boolean>(false);

    useEffect(() => {
        // Skip connection if server is not provided
        if (!server) {
            console.warn('Server address is not provided. Skipping connection.');
            setDetections(initialValue);
            return;
        }

        // Always use HTTP protocol since the Flask server is HTTP-only
        // This will work in HTTP contexts, and we'll handle the error in HTTPS contexts
        const url = `http://${server}/${endpoint}`;
        console.log(`Attempting to connect to SSE endpoint: ${url}`);

        let eventSource: EventSource;

        try {
            eventSource = new EventSource(url);
        } catch (error) {
            console.error('Failed to create EventSource:', error);
            setConnectionError(true);
            setDetections(initialValue);
            return;
        }

        // Handle incoming messages
        eventSource.onmessage = (event: MessageEvent) => {
            try {
                // Parse the JSON data
                const parsedData = JSON.parse(event.data);

                // Validate that the parsed data has the expected structure
                if (!parsedData || typeof parsedData !== 'object') {
                    console.error('Invalid SSE data format: Not an object', event.data);
                    return;
                }

                // Validate that 'stuff' array exists
                if (!Array.isArray(parsedData.stuff)) {
                    console.error('Invalid SSE data: Missing or invalid "stuff" array', event.data);
                    // Continue processing anyway as some features might still work without detections
                }

                // If pose is present, ensure it has the right structure
                if (parsedData.pose && (
                    typeof parsedData.pose !== 'object' ||
                    typeof parsedData.pose.x !== 'number' ||
                    typeof parsedData.pose.y !== 'number' ||
                    typeof parsedData.pose.theta !== 'number'
                )) {
                    console.warn('Invalid pose data in SSE message', parsedData.pose);
                    // Don't return, still process the rest of the data
                }

                // Cast to our type and set state
                const data: DetectionPayload = parsedData;
                setDetections(data);
                setConnectionError(false); // Reset connection error state on successful data
            } catch (error) {
                console.error('Failed to parse SSE data:', error);
                // Log the first 200 chars of the data to avoid flooding the console
                const truncatedData = typeof event.data === 'string'
                    ? (event.data.length > 200 ? event.data.substring(0, 200) + '...' : event.data)
                    : 'non-string data';
                console.debug('Raw data sample:', truncatedData);
            }
        };

        // Handle connection errors
        eventSource.onerror = (error) => {
            console.error('SSE connection error', error);
            setConnectionError(true);
            setDetections(initialValue);
            eventSource.close();
        };

        // Cleanup function
        return () => {
            console.log(`Closing SSE connection to: ${url}`);
            eventSource.close();
        };
    }, [server, endpoint, initialValue]);

    return { detections, connectionError };
}

// Window Component
const Window = ({ path, component: WindowComponent, title, latestDetections, serverConfig }: WindowProps) => {
  return (
    <MosaicWindow<number>
      path={path}
      title={title}
      additionalControls={[]}
    >
      <WindowComponent latestDetections={latestDetections} serverConfig={serverConfig} />
    </MosaicWindow>
  );
};

// Header Component
const Header: React.FC<{
  onToggleSettings: () => void,
  connectionError: boolean,
  serverConfig: string
}> = ({ onToggleSettings, connectionError, serverConfig }) => {
  // Function to reload the page
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <header className="border-b">
      <div className="flex items-center justify-between py-4 px-5 w-[100vw]">
        <div className="flex items-center h-16 ml-0">
          <img
            src="/vairc/paradigm.jpg"
            alt="Paradigm Logo"
            className="h-full border-r pr-4 mr-4"
            style={{mixBlendMode: 'multiply'}}
          />
          <img
            src="https://recf.org/wp-content/uploads/2024/10/VEX-AI-Robotics-Competition-Element-Sidebar.png"
            alt="VAIRC Logo"
            className="h-full"
          />
        </div>

        {/* Connection error warning */}
        {connectionError && (
          <div className="flex-1 mx-4">
            <div className="border rounded-md bg-destructive/10 p-3 text-destructive flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Connection error: Cannot connect to server at <code className="bg-destructive/20 p-0.5 rounded text-xs font-mono">{serverConfig}</code>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
              >
                <RotateCw className="h-3.5 w-3.5 mr-1" />
                Reload
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onToggleSettings}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </header>
  );
};

// Settings Modal
interface SettingsModalProps {
  isOpen: boolean;
  windowVisibility: Record<number, boolean>;
  windowTitles?: WindowTitleMap;
  serverConfig: string;
  onClose: () => void;
  onToggle: (windowId: number) => void;
  onServerConfigChange: (config: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  windowVisibility,
  windowTitles = {},
  serverConfig,
  onClose,
  onToggle,
  onServerConfigChange
}) => {
  if (!isOpen) return null;

  const windowCount = Object.keys(windowVisibility).length;
  const [tempServerConfig, setTempServerConfig] = useState(serverConfig);

  // Handle server config input change
  const handleServerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempServerConfig(e.target.value);
  };

  // Apply server config when user clicks "Apply"
  const handleApplyServerConfig = () => {
    onServerConfigChange(tempServerConfig);
  };

  // Reset to current value
  const handleResetServerConfig = () => {
    setTempServerConfig(serverConfig);
  };

  // Initialize tempServerConfig when the modal opens or serverConfig changes
  useEffect(() => {
    setTempServerConfig(serverConfig);
  }, [serverConfig, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your VAIRC dashboard settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Configuration Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Server Configuration</h3>
            <div className="space-y-2">
              <label htmlFor="server-config" className="text-sm">
                Server Host:Port
              </label>
              <div className="flex gap-2">
                <Input
                  id="server-config"
                  value={tempServerConfig}
                  onChange={handleServerInputChange}
                  placeholder="host:port"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyServerConfig}
                >
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetServerConfig}
                >
                  Reset
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Example: 192.168.86.98:5000
              </p>
            </div>
          </div>

          {/* Window Visibility Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Toggle Window Visibility</h3>
            <div className="space-y-4">
              {Array.from({ length: windowCount }).map((_, index) => {
                const windowId = index + 1;
                const title = windowTitles[windowId] ?? `Window ${windowId}`;
                const shouldRender = windowTitles[windowId] !== undefined;

                return shouldRender ? (
                  <div key={windowId} className="flex items-center justify-between">
                    <label
                      htmlFor={`window-${windowId}`}
                      className="text-sm cursor-pointer"
                    >
                      {title}
                    </label>
                    <Switch
                      id={`window-${windowId}`}
                      checked={windowVisibility[windowId] || false}
                      onCheckedChange={() => onToggle(windowId)}
                    />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Constants for localStorage keys
const LAYOUT_STORAGE_KEY = 'vairc-mosaic-layout';
const VISIBILITY_STORAGE_KEY = 'vairc-window-visibility';
const SERVER_CONFIG_KEY = 'vairc-server-config';

// Main Layout Component
export const Layout: React.FC<LayoutProps> = ({
  windowComponents,
  windowTitles = {},
}) => {
  const [currentNode, setCurrentNode] = useState<MosaicNode<number> | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [serverConfig, setServerConfig] = useState<string>(() => {
    // Try to load server config from localStorage
    const savedConfig = localStorage.getItem(SERVER_CONFIG_KEY);
    return savedConfig || DEFAULT_SERVER;
  });

  const { detections: latestDetections, connectionError } = useSSEDetections(
    serverConfig,
    "events",
    { stuff: [] } // Provide a default with empty stuff array
  );

  const [windowVisibility, setWindowVisibility] = useState<Record<number, boolean>>(() => {
    // Try to load visibility state from localStorage
    try {
      const savedVisibility = localStorage.getItem(VISIBILITY_STORAGE_KEY);
      if (savedVisibility) {
        const parsed = JSON.parse(savedVisibility);
        // Validate the parsed data
        if (parsed && typeof parsed === 'object') {
           console.log('Restored window visibility from localStorage');
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load or parse window visibility from localStorage:', error);
    }

    // Fall back to default initialization if no saved state or error
    const initialVisibility: Record<number, boolean> = {};
    const componentKeys = Object.keys(windowComponents).map(Number).sort((a, b) => a - b);

    // Initialize all windows to hidden initially
    for (const id of componentKeys) {
         initialVisibility[id] = false;
    }

    // Show the first window by default if components exist
    if (componentKeys.length > 0) {
         initialVisibility[componentKeys[0]] = true;
    }
    console.log('Initializing window visibility:', initialVisibility);
    return initialVisibility;
  });

  // Try to restore layout from localStorage on component mount
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        // Only set if not null (empty state is null)
        if (layout !== null) {
          setCurrentNode(layout);
          console.log('Restored layout from localStorage');
        } else {
            // If saved layout was explicitly null, ensure state is null
            setCurrentNode(null);
             console.log('Restored null layout from localStorage');
        }
      } else {
        console.log('No saved layout found. Initializing from visibility state via effect.');
      }
    } catch (error) {
      console.warn('Failed to load or parse layout from localStorage:', error);
    }
  }, []); // Empty dependency array means this runs only once on mount


  // Update the mosaic layout when window visibility changes
  const updateNodeStructure = useCallback(() => {
    const visibleWindows = Object.entries(windowVisibility)
      .filter(([, isVisible]) => isVisible)
      .map(([idStr]) => parseInt(idStr))
      .filter(id => windowComponents[id]); // Ensure component exists for the ID

    console.log("Visible windows:", visibleWindows);

    const newNode = visibleWindows.length === 0 ? null : createBalancedTreeFromLeaves(visibleWindows);
    console.log("Generated new layout node:", newNode);
    setCurrentNode(newNode);

    // Save visibility state to localStorage whenever it changes
    try {
      localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(windowVisibility));
      console.log('Saved window visibility to localStorage');
    } catch (error) {
      console.warn('Failed to save window visibility to localStorage:', error);
    }
  }, [windowVisibility, windowComponents]); // Dependencies for useCallback

  // Effect to update layout whenever visibility changes or on initial mount if no layout restored
  useEffect(() => {
      // This effect ensures the layout is built based on the current windowVisibility state.
      // It runs on mount and whenever windowVisibility changes.
      // It also ensures the layout is built correctly based on restored visibility on mount
      // if no layout was explicitly saved.
      if (currentNode === null) { // Only rebuild automatically if there's no saved layout or it's explicitly null
         updateNodeStructure();
         console.log('Visibility state changed or no saved layout, updating layout structure...');
      } else {
         // If a layout was restored, the visibility state might be inconsistent with it initially.
         // Let's ensure visibility is updated to match the restored layout nodes.
         const visibleIdsInLayout: Record<number, boolean> = {};
         if (currentNode) {
             // Recursively find all leaf nodes in the layout
             const findLeaves = (node: MosaicNode<number> | null, leaves: number[]) => {
                 if (node === null) return;
                 if (typeof node === 'number') {
                     leaves.push(node);
                 } else {
                     findLeaves(node.first, leaves);
                     findLeaves(node.second, leaves);
                 }
             }
             const currentLeaves: number[] = [];
             findLeaves(currentNode, currentLeaves);
             currentLeaves.forEach(id => { visibleIdsInLayout[id] = true; });
         }

         // Update visibility state to match the restored layout
         setWindowVisibility(prevVisibility => {
             const newVisibility = { ...prevVisibility };
             let changed = false;
             // Mark IDs in the layout as visible
             Object.keys(visibleIdsInLayout).map(Number).forEach(id => {
                 if (newVisibility[id] !== true) {
                     newVisibility[id] = true;
                     changed = true;
                 }
             });
             // Mark IDs not in the layout as hidden
             Object.keys(newVisibility).map(Number).forEach(id => {
                 if (!visibleIdsInLayout[id] && newVisibility[id] !== false) {
                     newVisibility[id] = false;
                     changed = true;
                 }
             });
             if (changed) {
                 console.log('Adjusted window visibility to match restored layout');
                 // Saving to localStorage happens in the toggleWindowVisibility handler or updateNodeStructure,
                 // which will be triggered if the newVisibility state changes the UI.
             }
             return newVisibility;
         });
      }

  }, [windowVisibility, updateNodeStructure, currentNode]); // Depend on windowVisibility, updateNodeStructure, and currentNode


  // Toggle window visibility
  const toggleWindowVisibility = useCallback((windowId: number) => {
    // Only toggle if the component for this ID exists
    if (windowComponents[windowId]) {
      setWindowVisibility(prevState => {
        const newState = {
          ...prevState,
          [windowId]: !prevState[windowId]
        };
         console.log(`Toggling window ${windowId} visibility to ${newState[windowId]}`);
        // Saving to localStorage is handled by the useEffect watching windowVisibility
        return newState;
      });
    } else {
        console.warn(`Attempted to toggle visibility for non-existent window ID: ${windowId}`);
    }
  }, [windowComponents]); // Dependency on windowComponents

  // Toggle settings modal
  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(open => !open);
  }, []); // No dependencies

  // Update server configuration
  const handleServerConfigChange = useCallback((newConfig: string) => {
    if (newConfig !== serverConfig) {
        setServerConfig(newConfig);
        // Save server config to localStorage
        try {
          localStorage.setItem(SERVER_CONFIG_KEY, newConfig);
          console.log(`Server configuration updated and saved to: ${newConfig}`);
        } catch (error) {
          console.warn('Failed to save server config to localStorage:', error);
        }
    }
  }, [serverConfig]); // Dependency on serverConfig

  // Create a new window from the zero state
  // This function is called by react-mosaic when the zero state button is clicked.
  // It MUST return a MosaicNode<number> (a number) or a Promise resolving to one.
  // It cannot return null or undefined.
  const createNewWindow = useCallback(() => {
      const availableComponentIds = Object.keys(windowComponents).map(Number).sort((a, b) => a - b);
      // Find the first window ID that is currently hidden
      const firstHiddenId = availableComponentIds.find(id => !windowVisibility[id]);

      let nodeIdToCreate: number;

      if (firstHiddenId !== undefined) {
          // Found a hidden window, use this ID
          nodeIdToCreate = firstHiddenId;
          console.log(`MosaicZeroState createNode: Adding first hidden window ${nodeIdToCreate}`);
      } else {
          // This case indicates a potential logic error if windowComponents is non-empty
          // and all windows are already visible. MosaicZeroState shouldn't be visible then.
          // If windowComponents is empty, there's a deeper issue handled below.
          console.error("Logic Error: createNewWindow called but no hidden windows found to add. Falling back to first available ID if possible.");
          // Fallback: find any available ID (the first one).
          const anyAvailableId = availableComponentIds[0];
          if (anyAvailableId === undefined) {
               // If windowComponents is empty, we truly cannot create anything.
               // This indicates a setup error. Throwing is appropriate.
               throw new Error("Cannot create new window: No components defined in windowComponents.");
          }
           // Fallback to the first available ID (which must be visible)
           nodeIdToCreate = anyAvailableId;
           console.warn(`Falling back to using first available window ${nodeIdToCreate} for createNode, but it should ideally be hidden.`);
      }

      // Toggle the visibility of the chosen window ID.
      // This state change will trigger the useEffect watching windowVisibility,
      // which calls updateNodeStructure to rebuild the layout.
      // Note: If firstHiddenId was not found and we used an already visible ID,
      // toggleWindowVisibility will actually make it hidden. This is an edge case
      // that indicates createNewWindow was called inappropriately (e.g., zero state
      // shown when all windows are visible). The expected flow is that zero state
      // is only shown when currentNode is null (meaning no windows are visible).
      toggleWindowVisibility(nodeIdToCreate);

      // Return the ID of the window to react-mosaic.
      // This is a MosaicNode<number> (a leaf node), satisfying the type requirement.
      // The ID returned here is the 'preferred' ID to add. Mosaic might add it
      // differently based on context (e.g., replacing the zero state).
      return nodeIdToCreate;

  }, [windowVisibility, toggleWindowVisibility, windowComponents]);


  // Save layout to localStorage when it changes (via drag/resize)
  const handleLayoutChange = useCallback((newNode: MosaicNode<number> | null) => {
    // console.log('Mosaic layout changed:', newNode); // Too noisy
    setCurrentNode(newNode);

    // Save to localStorage
    try {
      if (newNode) {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newNode));
        // console.log('Saved layout to localStorage'); // Too noisy
      } else {
        // If layout is null, remove from localStorage
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
        console.log('Removed layout from localStorage (became empty)');
      }
    } catch (error) {
      console.warn('Failed to save layout to localStorage:', error);
    }
  }, []); // No dependencies needed as it only uses its argument and localStorage API


  // Optional: Log state changes for debugging
  // useEffect(() => {
  //   console.log("Current window visibility state:", windowVisibility);
  // }, [windowVisibility]);

  // useEffect(() => {
  //   console.log("Current Mosaic node state:", currentNode);
  // }, [currentNode]);


  return (
    <div className="vairc-layout">
      <Header
        onToggleSettings={toggleSettings}
        connectionError={connectionError}
        serverConfig={serverConfig}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        windowVisibility={windowVisibility}
        windowTitles={windowTitles}
        serverConfig={serverConfig}
        onClose={toggleSettings}
        onToggle={toggleWindowVisibility}
        onServerConfigChange={handleServerConfigChange}
      />

      <div className="vairc-mosaic-container">
        <Mosaic<number>
          renderTile={(id, path) => {
            const WindowComponent = windowComponents[id];
            const title = windowTitles[id] ?? `Window ${id}`;

            // Note: We removed the check for windowVisibility[id] here.
            // The assumption is that react-mosaic-component only calls renderTile
            // for IDs that are present in the 'value' prop (currentNode).
            // The 'currentNode' is kept in sync with 'windowVisibility' by
            // the updateNodeStructure function and its useEffect triggers.

            return WindowComponent ? (
              <Window
                path={path}
                component={WindowComponent}
                title={title}
                latestDetections={latestDetections}
                serverConfig={serverConfig}
              />
            ) : (
              // Render placeholder for unknown components
              <MosaicWindow path={path} title={`Unknown Window ${id}`}>
                <div>Component not found for ID {id}</div>
              </MosaicWindow>
            );
          }}
          zeroStateView={<MosaicZeroState createNode={createNewWindow} />}
          value={currentNode}
          onChange={handleLayoutChange}
          // Additional Mosaic props if needed:
          // onRelease={(nodes) => { ... }}
          // dragElementContainedWithin={...}
        />
      </div>
    </div>
  );
};
```

```css aadishv.github.io/src/tools/vairc/app.css
/* aadishv.github.io/src/components/vairc/app.css */
html,
body,
#app {
  height: 100%;
  width: 100%;
  margin: 0;
}

/* Main layout container */
.vairc-layout {
  margin: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Mosaic container */
.vairc-mosaic-container {
  flex: 1;
  position: relative;
}

/* Override mosaic styles for a cleaner look */
.mosaic {
  background-color: #f6f8fa !important;
}

.mosaic-window {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  border-radius: 6px;
  overflow: hidden;
}

.mosaic-window-title {
  background-color: #f6f8fa;
  height: 30px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #d0d7de;
}

.mosaic-window-body {
  display: flex;
  flex-direction: column;
  background-color: white;
}

.mosaic-window-toolbar {
  display: flex;
}

.mosaic-window-controls {
  margin-left: auto;
}

/* Custom styles for the videos */
.mosaic-window-body .aspect-video {
  width: 100%;
  height: 100%;
}

/* Spinner for loading states */
.vairc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* V5 Details Panel Styles */
.v5-details-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  transition: transform 0.2s ease;
}

.v5-details-card:hover {
  transform: translateY(-2px);
}

.v5-details-heading {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #1a202c;
}

.v5-details-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2d3748;
  display: block;
  margin: 0.5rem 0;
}

.v5-details-label {
  font-size: 1.25rem;
  font-weight: 500;
  color: #718096;
}

/* Animated value transitions */
@keyframes pulse-highlight {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(66, 153, 225, 0.1); }
}

.v5-value-changed {
  animation: pulse-highlight 1s ease;
  border-radius: 4px;
}

.vairc-loading::after {
  content: "";
  width: 30px;
  height: 30px;
  border: 2px solid #d0d7de;
  border-radius: 50%;
  border-top-color: #0969da;
  animation: spinner 0.6s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .vairc-header {
    flex-direction: column;
    height: auto;
    align-items: stretch;
  }

  .vairc-header > div:not(:last-child) {
    margin-bottom: 8px;
  }
}
```

components
```tsx aadishv.github.io/src/tools/vairc/components/DetailsPanel.tsx
// aadishv.github.io/src/components/vairc/components/DetailsPanel.tsx
import React from "react";
import { type DetectionPayload } from "../Layout";
import { getDetectionColor } from "../utils/colors";
import { safeGetStuff } from "../utils/validation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { Card, CardContent } from "../../../components/ui/card";

// Details Panel
const DetailsPanel: React.FC<{latestDetections: DetectionPayload | null, serverConfig: string}> = ({
  latestDetections
}) => {
  // Extract flag information from detections with safe validation
  const stuff = safeGetStuff(latestDetections);

  // Extract flag information from detections
  const flags = stuff.filter(d =>
    d && typeof d === 'object' && d.class && (
      d.class.toLowerCase().includes('flag') ||
      d.class.toLowerCase() === 'red' ||
      d.class.toLowerCase() === 'blue'
    )
  );

  // Extract pose information (assuming bot detections might have pose data)
  const botDetections = stuff.filter(d =>
    d && typeof d === 'object' && d.class && (
      d.class.toLowerCase() === 'bot' ||
      d.class.toLowerCase().includes('pose')
    )
  );

  return (
    <div className="flex flex-col p-6 h-full overflow-auto bg-gray-50">
      {/* Objects Information Section */}
      <Accordion type="single" collapsible defaultValue="objects" className="mb-6">
        <AccordionItem value="objects">
          <AccordionTrigger className="text-xl font-semibold text-gray-800">
            Objects detected
          </AccordionTrigger>
          <AccordionContent>
            {flags.length > 0 ? (
              <div className="flex flex-col gap-3 mt-4">
                {flags.map((flag, index) => (
                  <Card
                    key={index}
                    className="border border-gray-200 overflow-hidden"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: getDetectionColor(flag.class)
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-2xl font-semibold capitalize" style={{ color: getDetectionColor(flag.class) }}>
                            {flag.class}
                          </span>
                        </div>
                        {flag.depth !== undefined && (
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-500">Distance</div>
                            <div className="text-xl font-mono">{flag.depth.toFixed(2)}m</div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500">Camera Position</div>
                          <div className="text-xl font-mono">
                            X: {flag.x.toFixed(0)} <br/>
                            Y: {flag.y.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Confidence</div>
                          <div className="text-xl font-mono">
                            {(flag.confidence * 100).toFixed(1)}%
                          </div>
                        </div>

                        {/* Field Position Section - Only show if fx/fy values are available */}
                        {(flag.fx !== undefined || flag.fy !== undefined || flag.fz !== undefined) && (
                          <div className="col-span-2 mt-2 border border-gray-200 p-2 rounded-md">
                            <div className="text-xs font-medium text-gray-500 mb-1">Field Position</div>
                            <div className="grid grid-cols-3 gap-2">
                              {flag.fx !== undefined && (
                                <div>
                                  <div className="text-xs text-gray-500">X-field</div>
                                  <div className="text-lg font-mono">{flag.fx.toFixed(2)}</div>
                                </div>
                              )}
                              {flag.fy !== undefined && (
                                <div>
                                  <div className="text-xs text-gray-500">Y-field</div>
                                  <div className="text-lg font-mono">{flag.fy.toFixed(2)}</div>
                                </div>
                              )}
                              {flag.fz !== undefined && (
                                <div>
                                  <div className="text-xs text-gray-500">Z-field</div>
                                  <div className="text-lg font-mono">{flag.fz.toFixed(2)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-lg text-gray-500 italic p-3 bg-white rounded-md border border-gray-200 mt-4">
                No objects detected
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Pose Information Section */}
      <Accordion type="single" collapsible defaultValue="pose">
        <AccordionItem value="pose">
          <AccordionTrigger className="text-xl font-semibold text-gray-800">
            Robot Pose
          </AccordionTrigger>
          <AccordionContent>
            {/* Display pose data directly from the payload */}
            {latestDetections?.pose ? (
              <Card className="border border-gray-200 mt-4 overflow-hidden border-l-4 border-l-blue-600">
                <CardContent className="p-3">
                  <div className="text-2xl font-semibold mb-2 text-gray-800">
                    Robot Position
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* X coordinate */}
                    <div className="border border-gray-200 p-2 rounded-md">
                      <div className="text-xs font-medium text-gray-500 mb-1">X Position</div>
                      <div className="text-xl font-mono">{latestDetections.pose.x.toFixed(2)}</div>
                    </div>

                    {/* Y coordinate */}
                    <div className="border border-gray-200 p-2 rounded-md">
                      <div className="text-xs font-medium text-gray-500 mb-1">Y Position</div>
                      <div className="text-xl font-mono">{latestDetections.pose.y.toFixed(2)}</div>
                    </div>

                    {/* Theta (orientation) */}
                    <div className="border border-gray-200 p-2 rounded-md">
                      <div className="text-xs font-medium text-gray-500 mb-1">Heading (θ)</div>
                      <div className="text-xl font-mono">{latestDetections.pose.theta.toFixed(1)}°</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Fallback to bot detections if no pose data is available
              botDetections.length > 0 ? (
                <div className="flex flex-col gap-3 mt-4">
                  {botDetections.map((bot, index) => (
                    <Card
                      key={index}
                      className="border border-gray-200 overflow-hidden border-l-4 border-l-gray-600"
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <span className="text-2xl font-semibold capitalize text-gray-800">
                              {bot.class}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="border border-gray-200 p-2 rounded-md">
                            <div className="text-xs font-medium text-gray-500 mb-1">Camera Position</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-gray-500">X-coord</div>
                                <div className="text-xl font-mono">{bot.x.toFixed(1)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Y-coord</div>
                                <div className="text-xl font-mono">{bot.y.toFixed(1)}</div>
                              </div>
                            </div>
                          </div>
                          {bot.depth !== undefined && (
                            <div className="border border-gray-200 p-2 rounded-md">
                              <div className="text-xs font-medium text-gray-500 mb-1">Distance</div>
                              <div className="text-xl font-mono">{bot.depth.toFixed(2)} m</div>
                            </div>
                          )}

                          {/* Field Position Section for bots - Only show if fx/fy values are available */}
                          {(bot.fx !== undefined || bot.fy !== undefined || bot.fz !== undefined) && (
                            <div className="col-span-2 mt-2 border border-gray-200 p-2 rounded-md">
                              <div className="text-xs font-medium text-gray-500 mb-1">Field Position</div>
                              <div className="grid grid-cols-3 gap-2">
                                {bot.fx !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500">X-field</div>
                                    <div className="text-lg font-mono">{bot.fx.toFixed(2)}</div>
                                  </div>
                                )}
                                {bot.fy !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500">Y-field</div>
                                    <div className="text-lg font-mono">{bot.fy.toFixed(2)}</div>
                                  </div>
                                )}
                                {bot.fz !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500">Z-field</div>
                                    <div className="text-lg font-mono">{bot.fz.toFixed(2)}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-lg text-gray-500 italic p-3 bg-white rounded-md border border-gray-200 mt-4">
                  No pose data available
                </div>
              )
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Jetson Statistics Section */}
      <Accordion type="single" collapsible defaultValue="jetson" className="mt-6">
        <AccordionItem value="jetson">
          <AccordionTrigger className="text-xl font-semibold text-gray-800">
            Jetson Stats
          </AccordionTrigger>
          <AccordionContent>
            {latestDetections?.jetson ? (
              <Card className="mt-4 border-l-4 border-l-green-600">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* CPU Temperature */}
                    <div className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-xs font-medium text-gray-500">CPU Temperature</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-mono font-semibold">
                          {latestDetections.jetson.cpu_temp.toFixed(1)}
                        </span>
                        <span className="text-lg ml-1">ºC</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (latestDetections.jetson.cpu_temp / 100) * 100)}%`,
                            backgroundColor: latestDetections.jetson.cpu_temp > 80 ? '#ef4444' :
                                          latestDetections.jetson.cpu_temp > 60 ? '#f59e0b' : '#10b981'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* GPU Temperature */}
                    <div className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-xs font-medium text-gray-500">GPU Temperature</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-mono font-semibold">
                          {latestDetections.jetson.gpu_temp.toFixed(1)}
                        </span>
                        <span className="text-lg ml-1">ºC</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (latestDetections.jetson.gpu_temp / 100) * 100)}%`,
                            backgroundColor: latestDetections.jetson.gpu_temp > 80 ? '#ef4444' :
                                          latestDetections.jetson.gpu_temp > 60 ? '#f59e0b' : '#10b981'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">System Uptime</div>
                    <div className="text-xl font-mono font-semibold">
                      {(() => {
                        // Format uptime in DD:HH:MM:SS
                        const uptime = latestDetections.jetson.uptime;
                        const days = Math.floor(uptime / (24 * 3600));
                        const hours = Math.floor((uptime % (24 * 3600)) / 3600);
                        const minutes = Math.floor((uptime % 3600) / 60);
                        const seconds = Math.floor(uptime % 60);

                        // Format with leading zeros
                        const pad = (num: number) => String(num).padStart(2, '0');
                        return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                      })()}
                    </div>
                    <div className="flex items-center mt-1.5 text-xs text-gray-500">
                      <span className="inline-block w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                      System running
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-lg text-gray-500 italic p-3 bg-white rounded-md border border-gray-200 mt-4">
                No Jetson stats available
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Last Updated Indicator */}
      {latestDetections && (
        <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></div>
              LIVE
            </span>
          </div>
          <div className="text-right text-xs text-gray-500 font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsPanel;
```

```tsx aadishv.github.io/src/tools/vairc/components/DetectionCanvas.tsx
// aadishv.github.io/src/components/vairc/components/DetectionCanvas.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SERVER, type DetectionPayload, type Detection } from "../Layout";
import { getDetectionColor } from "../utils/colors";
import { safeGetStuff, isValidDetectionPayload } from "../utils/validation";
import { Switch } from "../../../components/ui/switch";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

interface DetectionCanvasProps {
  /** The object containing detection data, or null if none */
  detections: DetectionPayload | null;
  /** URL for the MJPEG image stream */
  imageUrl?: string | null;
  /** Optional server configuration (host:port) */
  serverConfig?: string;
  /** Optional endpoint for the image stream */
  imageEndpoint?: string;
  /** The native width of the image source used for detections */
  originalImageWidth: number;
  /** The native height of the image source used for detections */
  originalImageHeight: number;
  /** Optional Tailwind classes for the container */
  className?: string;
  /** Optional flag to hide the component if no image URL is provided */
  hideWhenNoUrl?: boolean;
}

const DetectionCanvas: React.FC<DetectionCanvasProps> = ({
  detections,
  imageUrl = null,
  serverConfig = DEFAULT_SERVER,
  imageEndpoint,
  originalImageWidth,
  originalImageHeight,
  className = '',
  hideWhenNoUrl = true,
}) => {
  // Refs for canvas and image elements
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for image loading and errors
  const [imageError, setImageError] = useState(false);

  // State for bounding box toggle with localStorage persistence
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(() => {
    try {
      const saved = localStorage.getItem('vairc-show-bounding-boxes');
      return saved === null ? true : saved === 'true';
    } catch {
      return true; // Default to true if localStorage fails
    }
  });

  // URL construction
  const isHttps = window.location.protocol === 'https:';
  const effectiveImageUrl = imageUrl || (imageEndpoint ? `http://${serverConfig}/${imageEndpoint}` : null);
  const isMixedContent = isHttps && !!effectiveImageUrl && effectiveImageUrl.startsWith('http:');

  // Draw bounding boxes or clear canvas based on toggle state
  const updateCanvas = useCallback(() => {
    // First ensure we have a valid canvas
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get parent container dimensions
    const containerRect = canvas.parentElement?.getBoundingClientRect() || {
      width: canvas.offsetWidth,
      height: canvas.offsetHeight
    };

    // Set canvas size to match container dimensions
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // Always clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If boxes should be hidden or we don't have required data, just return after clearing
    if (!showBoundingBoxes || !imageRef.current || !detections) {
      return;
    }

    // Use safe validation utility to get the stuff array (returns empty array if invalid)
    const validDetections = safeGetStuff(detections);

    // If no valid detections to show, just return after clearing
    if (validDetections.length === 0) {
      return;
    }

    // Calculate the scaling factor from original image to displayed image size
    const imageAspectRatio = originalImageWidth / originalImageHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    // Calculate display dimensions accounting for aspect ratio
    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container relative to height
      displayWidth = containerRect.width;
      displayHeight = displayWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      // Image is taller than container relative to width
      displayHeight = containerRect.height;
      displayWidth = displayHeight * imageAspectRatio;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }

    // Calculate the scaling factors
    const scaleX = displayWidth / originalImageWidth;
    const scaleY = displayHeight / originalImageHeight;

    // Drawing settings
    ctx.lineWidth = 2;
    ctx.font = "16px monospace";
    ctx.textBaseline = "bottom";

    // Draw each detection
    validDetections.forEach((d: Detection) => {
      // Skip invalid detections
      if (!d || typeof d !== 'object' || typeof d.x !== 'number' ||
          typeof d.y !== 'number' || typeof d.width !== 'number' ||
          typeof d.height !== 'number' || !d.class) {
        return;
      }

      // Calculate scaled position and dimensions
      const boxWidth = d.width * scaleX;
      const boxHeight = d.height * scaleY;
      // Convert from center coordinates to top-left coordinates
      const x0 = (d.x - d.width / 2) * scaleX + (offsetX || 0);
      const y0 = (d.y - d.height / 2) * scaleY + (offsetY || 0);

      // Get color for this detection class
      const color = getDetectionColor(d.class);

      // Draw bounding box with white outline
      ctx.strokeStyle = color;
      ctx.strokeRect(x0, y0, boxWidth, boxHeight);
      ctx.strokeStyle = "white";
      ctx.strokeRect(x0+1, y0+1, boxWidth-2, boxHeight-2);

      // Prepare label text
      let label = `${d.class} ${d.confidence.toFixed(2)}`;
      if (d.depth !== undefined && d.depth !== null && d.depth >= 0) {
        label += ` d=${d.depth.toFixed(2)}m`;
      }

      // Calculate text dimensions
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const textHeight = 12; // Approx height for 12px font
      const padding = 4;

      // Position text above box, or below if it would go off the top
      let textBgY = y0 - textHeight - padding;
      let textY = y0 - padding / 2;

      // If text goes off the top edge, position below
      if (textBgY < 0) {
        textBgY = y0 + boxHeight + padding / 2;
        textY = textBgY + textHeight + padding / 2;
      }

      const textX = x0 + padding / 2 - 2;
      const textBgX = x0 - 2;

      // Draw label background
      ctx.fillStyle = color;
      ctx.fillRect(
        textBgX,
        textBgY,
        textWidth + padding,
        textHeight + padding
      );

      // Draw label text
      ctx.fillStyle = '#FFFFFF'; // White text
      ctx.fillText(label, textX, textY);
    });
  }, [detections, originalImageWidth, originalImageHeight, showBoundingBoxes]);

  // Handle image load and resize
  useEffect(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const image = imageRef.current;
    const container = containerRef.current;

    // When image loads
    const handleImageLoad = () => {
      setImageError(false);
      updateCanvas();
    };

    // When window or container resizes
    const handleResize = () => {
      updateCanvas();
    };

    // Simple debounce for resize events
    const debounce = (fn: Function, ms: number) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return function(...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(args), ms);
      };
    };

    const debouncedResize = debounce(handleResize, 200);

    // Add event listeners
    image.addEventListener('load', handleImageLoad);
    window.addEventListener('resize', debouncedResize);

    // Set up ResizeObserver for more reliable size changes
    let resizeObserver: ResizeObserver | null = null;
    if (container && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(debouncedResize);
      resizeObserver.observe(container);
    }

    // If image is already loaded
    if (image.complete && image.naturalWidth) {
      handleImageLoad();
    }

    // Cleanup
    return () => {
      image.removeEventListener('load', handleImageLoad);
      window.removeEventListener('resize', debouncedResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateCanvas]);

  // Update canvas when detections or toggle changes
  useEffect(() => {
    updateCanvas();
  }, [detections, showBoundingBoxes, updateCanvas]);

  // Handle image error
  const handleImageError = () => {
    console.error('Failed to load image stream');
    setImageError(true);
  };

  // Reload the image
  const reloadImage = () => {
    setImageError(false);
    if (imageRef.current && effectiveImageUrl) {
      const refreshedUrl = `${effectiveImageUrl}?t=${Date.now()}`;
      imageRef.current.src = refreshedUrl;
    }
  };

  // Toggle bounding boxes
  const toggleBoundingBoxes = () => {
    const newValue = !showBoundingBoxes;
    setShowBoundingBoxes(newValue);

    // Save to localStorage
    try {
      localStorage.setItem('vairc-show-bounding-boxes', String(newValue));
    } catch (error) {
      console.warn('Failed to save bounding box setting');
    }

    // Force an immediate canvas update
    // This is a backup to ensure the canvas clears immediately when toggled off
    // even if the effect doesn't trigger fast enough
    setTimeout(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          if (newValue) {
            // If turning on, force redraw
            updateCanvas();
          }
        }
      }
    }, 0);
  };

  // Hide component if no image URL and hideWhenNoUrl is true
  if (!effectiveImageUrl && hideWhenNoUrl) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {effectiveImageUrl ? (
            <>
              {/* The image element */}
              <img
                ref={imageRef}
                src={effectiveImageUrl}
                alt="Live stream"
                className="absolute top-0 left-0 w-full h-full object-contain"
                onError={handleImageError}
              />

              {/* Canvas for bounding boxes */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />

              {/* Mixed content warning */}
              {isMixedContent && (
                <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Card className="max-w-md border border-gray-300 bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center mb-4">
                        <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Mixed Content Blocked</h3>
                      <p className="mb-4 text-gray-600">Your browser is blocking the HTTP camera stream because this page is loaded over HTTPS.</p>
                      <div className="text-sm bg-gray-100 p-3 rounded-md text-left mb-4 border border-gray-200">
                        <p className="font-medium text-gray-700 mb-1">Solutions:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600">
                          <li>Access this page with HTTP instead of HTTPS</li>
                          <li>In Chrome, click the shield icon and allow insecure content</li>
                          <li>Consider setting up a secure proxy for your camera streams</li>
                        </ol>
                      </div>
                      <Button
                        onClick={() => {
                          const currentUrl = window.location.href;
                          const httpUrl = currentUrl.replace('https://', 'http://');
                          window.location.href = httpUrl;
                        }}
                      >
                        Switch to HTTP Version
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Image load error */}
              {imageError && !isMixedContent && (
                <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Card className="max-w-md border border-gray-300 bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center mb-4">
                        <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Stream Error</h3>
                      <p className="mb-4 text-gray-600">Failed to load the stream from:</p>
                      <div className="bg-gray-100 p-2 rounded-md border border-gray-200 mb-4 font-mono text-sm overflow-auto">
                        {effectiveImageUrl}
                      </div>
                      <Button
                        onClick={reloadImage}
                        className="flex items-center mx-auto"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry Connection
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            // Placeholder when no image URL
            <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500">
              No Image Stream
            </div>
          )}
        </div>
      </div>

      {/* Bounding box toggle control */}
      <div className="absolute top-2 right-2 z-10 bg-white bg-opacity-75 rounded border border-gray-200 px-2 py-1 flex items-center">
        <div className="flex items-center space-x-2">
          <Switch
            id="bounding-boxes-toggle"
            checked={showBoundingBoxes}
            onCheckedChange={toggleBoundingBoxes}
          />
          <label
            htmlFor="bounding-boxes-toggle"
            className="text-xs font-medium text-gray-800 cursor-pointer"
          >
            {showBoundingBoxes ? 'Boxes On' : 'Boxes Off'}
          </label>
        </div>
      </div>
    </div>
  );
};

export default DetectionCanvas;
```

```tsx aadishv.github.io/src/tools/vairc/components/Feeds.tsx
// aadishv.github.io/src/components/vairc/components/Feeds.tsx
import React, { useRef, useEffect, useState } from "react";
import DetectionCanvas from "./DetectionCanvas";
import { type DetectionPayload } from "../Layout";
import { ensureValidPayload } from "../utils/validation";

// Define our window components for the layout
export const ColorFeed: React.FC<{latestDetections: DetectionPayload, serverConfig: string}> = ({latestDetections, serverConfig}) => (
  <div className="w-full h-full flex items-center justify-center">
    <DetectionCanvas
      detections={ensureValidPayload(latestDetections)}
      serverConfig={serverConfig}
      imageEndpoint="color.mjpg"
      originalImageWidth={640}
      originalImageHeight={480}
      className="h-full"
    />
  </div>
);

export const DepthFeed: React.FC<{latestDetections: DetectionPayload, serverConfig: string}> = ({latestDetections, serverConfig}) => (
  <div className="w-full h-full flex items-center justify-center">
    <DetectionCanvas
      detections={ensureValidPayload(latestDetections)}
      serverConfig={serverConfig}
      imageEndpoint="depth.mjpg"
      originalImageWidth={640}
      originalImageHeight={480}
      className="h-full"
    />
  </div>
);

// BackCamera panel: MJPG stream from /color2.mjpg, no bounding boxes
export const BackCamera: React.FC<{latestDetections: DetectionPayload, serverConfig: string}> = ({latestDetections, serverConfig}) => (
  <div className="w-full h-full flex items-center justify-center">
    <DetectionCanvas
      detections={ensureValidPayload(latestDetections)}
      serverConfig={serverConfig}
      imageEndpoint="color2.mjpg"
      originalImageWidth={640}
      originalImageHeight={480}
      className="h-full"
    />
  </div>
);
```

```tsx aadishv.github.io/src/tools/vairc/components/FieldView.tsx
// aadishv.github.io/src/components/vairc/components/FieldView.tsx
import React, { useEffect, useRef, useState } from "react";
import type { DetectionPayload, Pose } from "../Layout";
import { Card, CardContent } from "../../../components/ui/card";
import { safeGetStuff, isValidDetectionPayload } from "../utils/validation";

// Field View Panel Component
const FieldView: React.FC<{latestDetections: DetectionPayload | null, serverConfig: string}> = ({latestDetections}) => {
  // References for drawing
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track when the image is actually loaded
  const [imageLoaded, setImageLoaded] = useState(false);

  // Effect to draw the field whenever detections or image loaded state changes
  useEffect(() => {
    // Skip if image is not loaded or no canvas
    if (!imageLoaded || !canvasRef.current) return;

    // Get the current pose directly from latest detections
    const currentPose = latestDetections?.pose || null;

    // Directly draw the field with the current pose
    const canvas = canvasRef.current;
    if (canvas) {
      drawField(canvas, currentPose, latestDetections);
    }
  }, [latestDetections, imageLoaded]);

  // Function to draw the field and robot with a specific pose
  const drawField = (canvas: HTMLCanvasElement, robotPose: Pose | null, detections: DetectionPayload | null) => {
    const image = imageRef.current;
    const container = containerRef.current;

    if (!canvas || !image || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // Field dimensions in inches
    const FIELD_WIDTH_INCHES = 152;
    const FIELD_HEIGHT_INCHES = 152;

    // Robot dimensions in inches (18x18 inch square robot)
    const ROBOT_SIZE_INCHES = 18;

    // Calculate scaling factor to convert inches to pixels
    const scaleX = containerRect.width / FIELD_WIDTH_INCHES;
    const scaleY = containerRect.height / FIELD_HEIGHT_INCHES;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio

    // Calculate offset to center the field
    const offsetX = (containerRect.width - FIELD_WIDTH_INCHES * scale) / 2;
    const offsetY = (containerRect.height - FIELD_HEIGHT_INCHES * scale) / 2;

    // Function to convert field coordinates (inches, origin at center, y-up)
    // to canvas coordinates (pixels, origin at top-left, y-down)
    const fieldToCanvas = (fieldX: number, fieldY: number) => {
      // 1. Translate from field center origin to top-left origin
      const centeredX = fieldX + FIELD_WIDTH_INCHES / 2;
      const centeredY = FIELD_HEIGHT_INCHES / 2 - fieldY; // Invert Y-axis

      // 2. Scale from inches to pixels
      const pixelX = centeredX * scale + offsetX;
      const pixelY = centeredY * scale + offsetY;

      return { x: pixelX, y: pixelY };
    };

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all detections first (behind the robot)
    if (isValidDetectionPayload(detections)) {
      const validDetections = safeGetStuff(detections);
      validDetections.forEach(detection => {
        // Only process detections that have absolute field coordinates
        if (detection && typeof detection === 'object' &&
            detection.fx !== undefined && detection.fy !== undefined &&
            typeof detection.fx === 'number' && typeof detection.fy === 'number') {
          // Calculate transparency based on confidence
          // Map from confidence range (0.2 - 1.0) to opacity range (0.0 - 1.0)
          const confidence = detection.confidence || 0;
          let opacity = 0;

          if (confidence <= 0.2) {
            opacity = 0; // Below 20% confidence is fully transparent
          } else if (confidence >= 1.0) {
            opacity = 1.0; // 100% confidence is fully opaque
          } else {
            // Linear interpolation between 0.2 and 1.0
            opacity = (confidence - 0.2) / 0.8;
          }

          // Set opacity for this detection
          ctx.globalAlpha = opacity; // 100% confidence is now fully opaque

          // All ring and goal coordinates are absolute
          const canvasPos = fieldToCanvas(detection.fx, detection.fy);
          const detectionClass = detection.class.toLowerCase();

          // Define sizes based on object type (in inches)
          let sizeInches = 0;
          switch (detectionClass) {
            case 'red':
            case 'blue':
              sizeInches = 8; // 8 inch OD for rings
              break;
            case 'goal':
              sizeInches = 10; // 10 inch OD for goals
              break;
            case 'bot':
              sizeInches = 18; // 18 inch OD for bots
              break;
            default:
              sizeInches = 8; // Default size
          }

          // Calculate pixel size
          const pixelSize = sizeInches * scale;

          // Create image path
          const imagePath = `/vairc/images/${detectionClass}.png`;

          // Create and use an image element
          const spriteImage = new Image();
          spriteImage.src = imagePath;

          // Function to draw the image properly cropped to square
          const drawCroppedImage = (img: HTMLImageElement) => {
            // Get image dimensions
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;

            // Determine crop dimensions to make the image square
            let sourceX = 0;
            let sourceY = 0;
            let sourceSize = Math.min(imgWidth, imgHeight);

            // If width > height, crop from center of width
            if (imgWidth > imgHeight) {
              sourceX = (imgWidth - sourceSize) / 2;
            }
            // If height > width, crop from center of height
            else if (imgHeight > imgWidth) {
              sourceY = (imgHeight - sourceSize) / 2;
            }

            // Draw the cropped image
            ctx.drawImage(
              img,
              sourceX, sourceY,      // Source position (top-left of crop)
              sourceSize, sourceSize, // Source dimensions (crop to square)
              canvasPos.x - pixelSize/2, // Destination position
              canvasPos.y - pixelSize/2,
              pixelSize, pixelSize    // Destination dimensions
            );
          };

          // If image is already loaded, draw it immediately
          if (spriteImage.complete && spriteImage.naturalWidth) {
            drawCroppedImage(spriteImage);
          } else {
            // Draw a placeholder while the image loads
            spriteImage.onload = () => {
              drawCroppedImage(spriteImage);
            };

            // Fallback if image fails to load
            spriteImage.onerror = () => {
              console.error(`Failed to load image: ${imagePath}`);
              // Draw a colored circle as fallback with opacity based on confidence
              ctx.fillStyle = detectionClass === 'red' ? `rgba(255, 0, 0, ${opacity})`
                            : detectionClass === 'blue' ? `rgba(0, 0, 255, ${opacity})`
                            : detectionClass === 'goal' ? `rgba(255, 255, 0, ${opacity})`
                            : `rgba(128, 128, 128, ${opacity})`;
              ctx.beginPath();
              ctx.arc(canvasPos.x, canvasPos.y, pixelSize/2, 0, Math.PI * 2);
              ctx.fill();
            };
          }
        }
      });

      // Reset global alpha after drawing detections
      ctx.globalAlpha = 1.0;
    }

    // Draw the robot if we have pose data
    if (robotPose &&
        typeof robotPose === 'object' &&
        typeof robotPose.x === 'number' &&
        typeof robotPose.y === 'number' &&
        typeof robotPose.theta === 'number') {
      const { x, y, theta } = robotPose;

      // Convert robot position from field to canvas coordinates
      const canvasPos = fieldToCanvas(x, y);

      // Calculate robot size in pixels
      const robotSizePixels = ROBOT_SIZE_INCHES * scale;
      const halfSize = robotSizePixels / 2;

      // Define robot corners relative to its center position (in canvas pixel space)
      const corners = [
        { x: -halfSize, y: -halfSize }, // Top-left
        { x: halfSize, y: -halfSize },  // Top-right
        { x: halfSize, y: halfSize },   // Bottom-right
        { x: -halfSize, y: halfSize }   // Bottom-left
      ];

      // Rotate and position the robot corners
      // For CCW rotation where 0 = up (north)
      const rotatedCorners = corners.map(corner => {
        // Convert theta from degrees to radians for trigonometric functions
        const thetaRadians = theta * (Math.PI / 180);

        // Rotate the corner around robot center - using counterclockwise rotation formula
        const cosTheta = Math.cos(thetaRadians);
        const sinTheta = Math.sin(thetaRadians);

        const rotatedX = corner.x * cosTheta + corner.y * sinTheta;
        const rotatedY = -corner.x * sinTheta + corner.y * cosTheta;

        // Translate to robot position on canvas
        return {
          x: canvasPos.x + rotatedX,
          y: canvasPos.y + rotatedY
        };
      });

      // Draw robot body
      ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
      ctx.beginPath();
      ctx.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      for (let i = 1; i < rotatedCorners.length; i++) {
        ctx.lineTo(rotatedCorners[i].x, rotatedCorners[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // Draw robot outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      for (let i = 1; i < rotatedCorners.length; i++) {
        ctx.lineTo(rotatedCorners[i].x, rotatedCorners[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw blue front face (0-1 side to be on top when the robot is at 0° orientation)
      ctx.strokeStyle = 'rgba(0, 102, 255, 1.0)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      ctx.lineTo(rotatedCorners[1].x, rotatedCorners[1].y);
      ctx.stroke();

      // Draw a small dot at the robot center for reference
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Handle image load
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleImageLoad = () => {
      console.log("Field image loaded");
      setImageLoaded(true);
    };

    // Add event listener
    image.addEventListener('load', handleImageLoad);

    // If image is already loaded
    if (image.complete && image.naturalWidth) {
      handleImageLoad();
    }

    // Cleanup
    return () => {
      image.removeEventListener('load', handleImageLoad);
    };
  }, []);

  // Effect to handle resize events
  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return;

    // Handle resize
    const handleResize = () => {
      console.log("Resize detected");
      if (canvasRef.current && latestDetections?.pose) {
        drawField(canvasRef.current, latestDetections.pose, latestDetections);
      }
    };

    // Create a ResizeObserver for better size change detection
    const resizeObserver = new ResizeObserver(() => {
      console.log("Container size changed");
      handleResize();
    });

    // Add resize listeners
    window.addEventListener('resize', handleResize);
    resizeObserver.observe(container);
    resizeObserver.observe(image);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [latestDetections]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-100 p-2 border-b border-gray-200 text-sm font-medium text-gray-700">
        <span>VEX High Stakes Field</span>
      </div>
      <div className="flex-1 relative overflow-hidden bg-white" ref={containerRef}>
        {/* Field container - using a single centered container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Image and canvas container with fixed aspect ratio */}
          <div className="relative w-full h-full">
            {/* Image element - ensure it's properly sized and centered */}
            <img
              ref={imageRef}
              src={"/vairc/field.png"}
              alt="VEX Field View"
              className={`absolute top-0 left-0 w-full h-full object-contain ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
              loading="eager"
            />

            {/* Placeholder while image is loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading field view...</div>
              </div>
            )}

            {/* Canvas overlay perfectly aligned with image */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldView;
```

```tsx aadishv.github.io/src/tools/vairc/components/InfoPanels.tsx
// aadishv.github.io/src/components/vairc/components/InfoPanels.tsx
import React from "react";
import type { DetectionPayload } from "../Layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../../../components/ui/tabs";
import { Card, CardContent } from "../../../components/ui/card";

export const JsonRenderer: React.FC<{latestDetections: DetectionPayload | null, serverConfig: string}> = ({latestDetections}) => (
  <div className="flex flex-col p-4 overflow-auto h-full">
   <pre className="text-sm">{JSON.stringify(latestDetections || { stuff: [] }, null, 2)}</pre>
  </div>
);

export const InfoPanel: React.FC<{serverConfig: string}> = ({serverConfig}) => {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <Tabs defaultValue="overview" className="w-full h-full">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-4 py-2"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="tutorial"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-4 py-2"
            >
              Tutorial
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-4 py-2"
            >
              Settings Guide
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <TabsContent value="overview" className="h-full m-0 overflow-auto">
            <div>
              <h3 className="text-lg font-medium mb-2">VAIRC Vision System</h3>
              <p className="mb-4">Real-time object detection and tracking interface for the VEX AI Racing Challenge.</p>
              <h4 className="font-medium text-gray-700 mt-4 mb-2">Available Views:</h4>
              <ul className="list-disc ml-5 space-y-2">
                <li><span className="font-medium">Color Feed:</span> RGB camera view with object detections</li>
                <li><span className="font-medium">Depth Feed:</span> Depth map camera view showing distance information</li>
                <li><span className="font-medium">Raw JSON:</span> Live detection data in JSON format for debugging</li>
                <li><span className="font-medium">Field View:</span> Top-down view of the field with robot position</li>
                <li><span className="font-medium">Details Panel:</span> Structured information about detections</li>
              </ul>

              <Card className="mt-4 bg-blue-50 border-blue-400 border-l-4">
                <CardContent className="p-3 text-sm text-blue-800">
                  <strong>Tip:</strong> Use the Settings button in the header to customize your layout and configure the server connection.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tutorial" className="h-full m-0 overflow-auto">
            <div>
              <h3 className="text-lg font-medium mb-3">How to Use VAIRC</h3>

              <div className="space-y-6">
                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Getting Started</h4>
                  <ol className="list-decimal ml-5 space-y-3">
                    <li>
                      <p className="mb-1"><span className="font-medium">Connect to your Jetson:</span> Click the Settings gear in the header and enter your Jetson's IP address and port.</p>
                      <p className="text-sm text-gray-600">Example: 192.168.86.98:5000</p>
                    </li>
                    <li>
                      <p className="mb-1"><span className="font-medium">Add views:</span> Use the Settings panel to enable different windows like Color Feed, Depth Feed, etc.</p>
                    </li>
                    <li>
                      <p><span className="font-medium">Arrange your layout:</span> Drag and resize windows by their handles to customize your workspace.</p>
                    </li>
                  </ol>
                </section>

                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Working with Detection Views</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 font-medium">Toggle Bounding Boxes:</p>
                      <p>Use the toggle switch in the top-right corner of camera views to show/hide detection boxes.</p>
                    </div>

                    <div>
                      <p className="mb-1 font-medium">Understanding Detection Labels:</p>
                      <p>Each detection box shows:</p>
                      <ul className="list-disc ml-5 space-y-1 mt-1">
                        <li><span className="font-mono text-sm">Class</span> - Object type (red, blue, flag, etc.)</li>
                        <li><span className="font-mono text-sm">Confidence</span> - Detection certainty (0-1)</li>
                        <li><span className="font-mono text-sm">Distance</span> - Estimated distance in meters (if available)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Using the Field View</h4>
                  <p>The Field View provides a top-down perspective of the field with your robot's position:</p>
                  <ul className="list-disc ml-5 space-y-2 mt-2">
                    <li>Gray rectangle shows your robot's position and orientation</li>
                    <li>Black arrow indicates the forward direction</li>
                    <li>Coordinates are based on the field coordinate system (in inches)</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Details Panel</h4>
                  <p>The Details Panel provides organized information about:</p>
                  <ul className="list-disc ml-5 space-y-2 mt-2">
                    <li>Detected objects with positions and confidence values</li>
                    <li>Current robot pose (x, y, heading)</li>
                    <li>System status and Jetson statistics</li>
                  </ul>
                  <p className="mt-2">Use the collapsible sections to focus on the data you need.</p>
                </section>

                <Card className="mt-4 bg-yellow-50 border-yellow-400 border-l-4">
                  <CardContent className="p-3 text-sm text-yellow-800">
                    <strong>Note:</strong> If you experience connection issues, check that your Jetson is running the correct server software and is accessible on your network.
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0 overflow-auto">
            <div>
              <h3 className="text-lg font-medium mb-3">Settings Guide</h3>

              <div className="space-y-6">
                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Server Configuration</h4>
                  <p className="mb-2">To connect to your vision system server:</p>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>Click the ⚙️ Settings button in the header</li>
                    <li>Enter your server's IP address and port in the format <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">host:port</code></li>
                    <li>Click "Apply" to save changes</li>
                  </ol>

                  <Card className="mt-3 bg-gray-50">
                    <CardContent className="p-3 text-sm">
                      <p className="font-medium">Common Connection Issues:</p>
                      <ul className="list-disc ml-5 space-y-1 mt-1">
                        <li>Ensure your computer is on the same network as the Jetson</li>
                        <li>Verify the Jetson server is running (SSH in and check processes)</li>
                        <li>Check for firewalls blocking connections</li>
                        <li>For HTTPS/HTTP mixed content errors, use the HTTP version or allow insecure content</li>
                      </ul>
                    </CardContent>
                  </Card>
                </section>

                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Window Management</h4>
                  <p className="mb-2">Customize your layout with these features:</p>

                  <h5 className="font-medium text-gray-700 mt-3 mb-1">Toggling Windows</h5>
                  <p>In the Settings panel, use the toggle switches to show/hide specific windows.</p>

                  <h5 className="font-medium text-gray-700 mt-3 mb-1">Arranging Windows</h5>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Drag a window's title bar to move it</li>
                    <li>Hover near edges between windows to see resize handles</li>
                    <li>The layout is automatically saved to your browser</li>
                  </ul>

                  <h5 className="font-medium text-gray-700 mt-3 mb-1">Splitting Windows</h5>
                  <p>When dragging a window, drop zones will appear allowing you to:</p>
                  <ul className="list-disc ml-5 space-y-1 mt-1">
                    <li>Split horizontally (top/bottom)</li>
                    <li>Split vertically (left/right)</li>
                    <li>Replace an existing window</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Troubleshooting</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium mb-1">Camera Streams Not Loading:</p>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>Check server connection and network access</li>
                        <li>Ensure camera devices are properly connected to the Jetson</li>
                        <li>Try restarting the server application</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium mb-1">Layout Reset:</p>
                      <p>If you need to reset your layout completely:</p>
                      <ol className="list-decimal ml-5 space-y-1">
                        <li>Open your browser's developer tools</li>
                        <li>Go to Application → Storage → Local Storage</li>
                        <li>Delete the VAIRC layout and visibility keys</li>
                        <li>Refresh the page</li>
                      </ol>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer with connection info */}
      <div className="mt-auto pt-3 border-t border-gray-200 p-4">
        <p className="text-sm font-medium">Connected to server:</p>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{serverConfig}</code>
      </div>
    </div>
  );
};
```


context
```tsx aadishv.github.io/src/tools/vairc/context/DetectionContext.tsx
// aadishv.github.io/src/components/vairc/context/DetectionContext.tsx
import React, { createContext, useState, useContext } from 'react';
import type { Detection } from '../Layout';

// Define source types for highlighted detections
export type HighlightSource = 'details-panel' | 'field-view' | 'other' | null;

interface DetectionContextType {
  // The currently highlighted detection, if any
  highlightedDetection: Detection | null;
  // The source component that set the highlighted detection
  highlightSource: HighlightSource;
  // Function to set the highlighted detection with source information
  setHighlightedDetection: (detection: Detection | null, source?: HighlightSource) => void;
}

// Create the context with default values
const DetectionContext = createContext<DetectionContextType>({
  highlightedDetection: null,
  highlightSource: null,
  setHighlightedDetection: () => {}
});

// Provider component that will wrap the app
export const DetectionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [highlightedDetection, setHighlightedDetection] = useState<Detection | null>(null);
  const [highlightSource, setHighlightSource] = useState<HighlightSource>(null);

  // Enhanced setter function that tracks the source
  const setHighlightWithSource = (detection: Detection | null, source: HighlightSource = 'other') => {
    setHighlightedDetection(detection);
    setHighlightSource(detection ? source : null);
  };

  return (
    <DetectionContext.Provider value={{
      highlightedDetection,
      highlightSource,
      setHighlightedDetection: setHighlightWithSource
    }}>
      {children}
    </DetectionContext.Provider>
  );
};

// Custom hook for using the detection context
export const useDetectionContext = () => useContext(DetectionContext);
```


utils
```ts aadishv.github.io/src/tools/vairc/utils/colors.ts
// aadishv.github.io/src/components/vairc/utils/colors.ts
// Utility function to get color for detection classes
export const getDetectionColor = (className: string): string => {
  switch (className?.toLowerCase()) {
    case 'blue':
      return '#0000FF'; // Blue
    case 'goal':
      return '#FFD700'; // Gold
    case 'red':
      return '#FF0000'; // Red
    case 'bot':
      return '#000000'; // Black
    default:
      return '#FF00FF'; // Default Magenta for unknown
  }
};
```

```ts aadishv.github.io/src/tools/vairc/utils/validation.ts
// aadishv.github.io/src/components/vairc/utils/validation.ts
import type { DetectionPayload, Detection } from "../Layout";

/**
 * Validates a detection payload and ensures it has the expected structure
 * @param payload The detection payload to validate
 * @returns True if the payload is valid, false otherwise
 */
export function isValidDetectionPayload(payload: DetectionPayload | null): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  // Check if stuff exists and is an array
  if (!Array.isArray(payload.stuff)) {
    return false;
  }

  return true;
}

/**
 * Validates an individual detection object
 * @param detection The detection to validate
 * @returns True if the detection is valid, false otherwise
 */
export function isValidDetection(detection: Detection | null): boolean {
  if (!detection || typeof detection !== 'object') {
    return false;
  }

  // Check for required properties
  if (typeof detection.x !== 'number' ||
      typeof detection.y !== 'number' ||
      typeof detection.width !== 'number' ||
      typeof detection.height !== 'number' ||
      typeof detection.class !== 'string' ||
      typeof detection.confidence !== 'number') {
    return false;
  }

  return true;
}

/**
 * Ensures a detection payload has a valid structure, or returns a default empty payload
 * @param payload The detection payload to validate
 * @returns The original payload if valid, or a default empty payload
 */
export function ensureValidPayload(payload: DetectionPayload | null): DetectionPayload {
  if (isValidDetectionPayload(payload)) {
    return payload as DetectionPayload;
  }

  // Return a default payload
  return { stuff: [] };
}

/**
 * Safely get the stuff array from a detection payload
 * @param payload The detection payload
 * @returns The stuff array if it exists and is valid, or an empty array
 */
export function safeGetStuff(payload: DetectionPayload | null): Detection[] {
  if (isValidDetectionPayload(payload)) {
    return payload!.stuff;
  }
  return [];
}
```
