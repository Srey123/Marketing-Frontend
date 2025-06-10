import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ArrowUpCircle, Undo2, FileDiff, Copy, Check } from 'lucide-react';

const IterationsSection = () => {
  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const iterations = [
    {
      id: 'v3',
      date: 'Today, 2:45 PM',
      title: 'Final Version',
      content: 'Our data-driven marketing approach combines deep analytics with creative strategy to deliver campaigns that not only reach your target audience but truly resonate with them. We focus on measurable results, ensuring every marketing dollar generates maximum ROI while building your brand equity.',
      score: 92,
      improvements: ['Improved keyword density', 'Enhanced call-to-action', 'Fixed grammar issues'],
    },
    {
      id: 'v2',
      date: 'Today, 1:30 PM',
      title: 'Second Draft',
      content: 'Our data-driven marketing approach combines analytics with creative strategy to deliver campaigns that reach your target audience. We focus on measurable results, ensuring your marketing budget generates good ROI while building brand awareness.',
      score: 78,
      improvements: ['Added more specific benefits', 'Improved sentence structure'],
    },
    {
      id: 'v1',
      date: 'Today, 12:15 PM',
      title: 'Initial Draft',
      content: 'We use data to create marketing campaigns that reach your audience. Our approach focuses on results and helps you get good returns on your marketing spend.',
      score: 65,
      improvements: ['First draft created'],
    },
  ];
  
  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Content Iterations</h1>
        <p className="text-muted-foreground">
          Track the evolution of your marketing content
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>Track all iterations of your content</CardDescription>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {iterations.map((iteration, index) => (
                  <div 
                    key={iteration.id}
                    className={`rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                      selectedVersion === iteration.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedVersion(iteration.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{iteration.title}</h4>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{iteration.date}</span>
                        </div>
                      </div>
                      <Badge className={getScoreColor(iteration.score)}>
                        Score: {iteration.score}
                      </Badge>
                    </div>
                    
                    <p className="mt-2 text-sm line-clamp-2">
                      {iteration.content}
                    </p>
                    
                    {index < iterations.length - 1 && (
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                        <span>+{iteration.score - iterations[index + 1].score} points improvement</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {iterations.find(i => i.id === selectedVersion)?.title}
                </CardTitle>
                <CardDescription>
                  {iterations.find(i => i.id === selectedVersion)?.date}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Undo2 className="mr-1 h-4 w-4" />
                  Revert to this version
                </Button>
                <Button variant="outline" size="sm">
                  <FileDiff className="mr-1 h-4 w-4" />
                  Compare
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pt-2 pb-4">
                        <p className="text-base leading-relaxed">
                          {iterations.find(i => i.id === selectedVersion)?.content}
                        </p>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          const content = iterations.find(i => i.id === selectedVersion)?.content || '';
                          handleCopy(content, iterations.findIndex(i => i.id === selectedVersion));
                        }}
                      >
                        {copiedIndex === iterations.findIndex(i => i.id === selectedVersion) ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getScoreColor(iterations.find(i => i.id === selectedVersion)?.score || 0)}>
                          SEO Score: {iterations.find(i => i.id === selectedVersion)?.score || 0}/100
                        </Badge>
                        <Badge variant="outline">Words: {iterations.find(i => i.id === selectedVersion)?.content.split(' ').length}</Badge>
                      </div>
                      
                      <Button>
                        Generate New Version
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="improvements" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium mb-4">Changes in this version</h3>
                    
                    <div className="space-y-4">
                      {iterations.find(i => i.id === selectedVersion)?.improvements.map((improvement, i) => (
                        <div key={i} className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          </div>
                          <p className="ml-3">{improvement}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="metrics" className="mt-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 text-center">
                        <h4 className="text-sm font-medium text-muted-foreground">Readability</h4>
                        <p className="text-2xl font-bold mt-1">Good</p>
                        <p className="text-xs text-muted-foreground mt-1">Grade level 8</p>
                      </div>
                      
                      <div className="border rounded-lg p-4 text-center">
                        <h4 className="text-sm font-medium text-muted-foreground">Sentiment</h4>
                        <p className="text-2xl font-bold mt-1">Positive</p>
                        <p className="text-xs text-muted-foreground mt-1">Score: 0.8/1.0</p>
                      </div>
                      
                      <div className="border rounded-lg p-4 text-center">
                        <h4 className="text-sm font-medium text-muted-foreground">Keywords</h4>
                        <p className="text-2xl font-bold mt-1">5</p>
                        <p className="text-xs text-muted-foreground mt-1">Density: 2.4%</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">Top Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">marketing</Badge>
                        <Badge variant="outline">data-driven</Badge>
                        <Badge variant="outline">approach</Badge>
                        <Badge variant="outline">strategy</Badge>
                        <Badge variant="outline">results</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IterationsSection;