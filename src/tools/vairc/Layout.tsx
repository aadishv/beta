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
