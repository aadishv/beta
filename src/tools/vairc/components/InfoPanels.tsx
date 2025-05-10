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