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
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load window visibility from localStorage:', error);
    }

    // Fall back to default initialization if no saved state or error
    const initialVisibility: Record<number, boolean> = {};
    const componentKeys = Object.keys(windowComponents).map(Number).sort((a, b) => a - b);

    // Initialize all windows to hidden
    for (let i = 1; i <= componentKeys.length; i++) {
        initialVisibility[i] = false;
    }

    // Show the first window by default
    let visibleCount = 0;
    for (const id of componentKeys) {
      if (visibleCount < 1) {
         initialVisibility[id] = true;
         visibleCount++;
      }
    }
    return initialVisibility;
  });

  // Try to restore layout from localStorage on component mount
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        if (layout) {
          setCurrentNode(layout);
          console.log('Restored layout from localStorage');
        }
      }
    } catch (error) {
      console.warn('Failed to load layout from localStorage:', error);
    }
  }, []);

  // Update the mosaic layout when window visibility changes
  const updateNodeStructure = useCallback(() => {
    const visibleWindows = Object.entries(windowVisibility)
      .filter(([, isVisible]) => isVisible)
      .map(([idStr]) => parseInt(idStr))
      .filter(id => windowComponents[id]);

    const newNode = visibleWindows.length === 0 ? null : createBalancedTreeFromLeaves(visibleWindows);
    setCurrentNode(newNode);

    // Save visibility state to localStorage
    try {
      localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(windowVisibility));
    } catch (error) {
      console.warn('Failed to save window visibility to localStorage:', error);
    }
  }, [windowVisibility, windowComponents]);

  // Toggle window visibility
  const toggleWindowVisibility = useCallback((windowId: number) => {
    if (windowComponents[windowId]) {
      setWindowVisibility(prevState => {
        const newState = {
          ...prevState,
          [windowId]: !prevState[windowId]
        };

        // Save to localStorage immediately
        try {
          localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to save window visibility to localStorage:', error);
        }

        return newState;
      });
    }
  }, [windowComponents]);

  // Toggle settings modal
  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(open => !open);
  }, []);

  // Update server configuration
  const handleServerConfigChange = useCallback((newConfig: string) => {
    setServerConfig(newConfig);

    // Save server config to localStorage
    try {
      localStorage.setItem(SERVER_CONFIG_KEY, newConfig);
    } catch (error) {
      console.warn('Failed to save server config to localStorage:', error);
    }

    console.log(`Server configuration updated to: ${newConfig}`);
  }, []);

  // Create a new window from the zero state
  const createNewWindow = useCallback(() => {
    const availableComponentIds = Object.keys(windowComponents).map(Number);
    for (const id of availableComponentIds.sort((a, b) => a - b)) {
      if (!windowVisibility[id]) {
        toggleWindowVisibility(id);
        return id;
      }
    }
    return null;
  }, [windowVisibility, toggleWindowVisibility, windowComponents]);

  // Save layout to localStorage when it changes
  const handleLayoutChange = useCallback((newNode: MosaicNode<number> | null) => {
    setCurrentNode(newNode);

    // Save to localStorage
    try {
      if (newNode) {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newNode));
      } else {
        // If layout is null, remove from localStorage
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save layout to localStorage:', error);
    }
  }, []);

  // Update node structure when visibility changes
  useEffect(() => {
    updateNodeStructure();
  }, [windowVisibility, updateNodeStructure]);

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
            return WindowComponent ? (
              <Window
                path={path}
                component={WindowComponent}
                title={title}
                latestDetections={latestDetections}
                serverConfig={serverConfig}
              />
            ) : (
              <MosaicWindow path={path} title={`Unknown Window ${id}`}>
                <div>Component not found for ID {id}</div>
              </MosaicWindow>
            );
          }}
          zeroStateView={<MosaicZeroState createNode={createNewWindow} />}
          value={currentNode}
          onChange={handleLayoutChange}
        />
      </div>
    </div>
  );
};
