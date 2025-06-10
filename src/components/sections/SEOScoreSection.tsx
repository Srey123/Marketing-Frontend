import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight,  CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const SEOScoreSection = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setProgress(78), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">SEO Score</h1>
        <p className="text-muted-foreground">
          Track and improve your content's search engine optimization
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Overall Score</CardTitle>
            <CardDescription>Your content's SEO health</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="10"
                    strokeDasharray={283}
                    strokeLinecap="round"
                    fill="none"
                    cx="50"
                    cy="50"
                    r="45"
                  />
                  <circle
                    className="text-blue-500 stroke-current"
                    strokeWidth="10"
                    strokeDasharray={283}
                    strokeDashoffset={283 - (283 * progress) / 100}
                    strokeLinecap="round"
                    fill="none"
                    cx="50"
                    cy="50"
                    r="45"
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-4xl font-bold ${getScoreColor(progress)}`}>{progress}</span>
                  <span className="text-sm text-muted-foreground">out of 100</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">+12 points from last check</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Detailed breakdown of your SEO performance</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Keywords Optimization</span>
                  <span className="text-sm font-medium text-green-500">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Readability</span>
                  <span className="text-sm font-medium text-green-500">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Technical SEO</span>
                  <span className="text-sm font-medium text-amber-500">68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Mobile Optimization</span>
                  <span className="text-sm font-medium text-red-500">52%</span>
                </div>
                <Progress value={52} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Link Structure</span>
                  <span className="text-sm font-medium text-amber-500">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Actions to improve your SEO score
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="critical">
            <TabsList className="mb-4">
              <TabsTrigger value="critical">Critical Issues</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
              <TabsTrigger value="passed">Passed Checks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="critical" className="space-y-4">
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Improve mobile responsiveness</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your content doesn't display properly on mobile devices. Consider using responsive design principles.
                  </p>
                  <Badge variant="outline" className="mt-2">High Priority</Badge>
                </div>
              </div>
              
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Add meta description</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your page is missing a meta description which is crucial for SEO performance.
                  </p>
                  <Badge variant="outline" className="mt-2">High Priority</Badge>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="warnings" className="space-y-4">
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Optimize image sizes</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Several images are too large and may slow down page loading speed.
                  </p>
                  <Badge variant="outline" className="mt-2">Medium Priority</Badge>
                </div>
              </div>
              
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Improve heading structure</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your content uses H2 before H1 in some sections. Maintain proper heading hierarchy.
                  </p>
                  <Badge variant="outline" className="mt-2">Medium Priority</Badge>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="passed" className="space-y-4">
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Keyword usage</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your content uses target keywords with optimal density and placement.
                  </p>
                </div>
              </div>
              
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">SSL/HTTPS enabled</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your site uses secure HTTPS protocol which improves SEO ranking.
                  </p>
                </div>
              </div>
              
              <div className="rounded-md border p-4 flex items-start space-x-4">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Content readability</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your content has excellent readability scores, making it accessible to a wide audience.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOScoreSection;