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