#include "quality.h"
#include <vector>
#include <algorithm>
#include <cmath>
extern "C" int image_quality(const uint8_t* rgb,int width,int height,int length,QualityMetrics* result){
 if(!rgb||!result||width<3||height<3||width>4096||height>4096||static_cast<int64_t>(width)*height*3!=length)return 1;
 try{
  std::vector<double> gray(static_cast<size_t>(width)*height);double brightness=0;
  for(size_t i=0;i<gray.size();++i){gray[i]=.2126*rgb[i*3]+.7152*rgb[i*3+1]+.0722*rgb[i*3+2];brightness+=gray[i];}
  double sum=0,squares=0;size_t count=0;
  for(int y=1;y<height-1;++y)for(int x=1;x<width-1;++x){size_t i=static_cast<size_t>(y)*width+x;double lap=gray[i-1]+gray[i+1]+gray[i-width]+gray[i+width]-4*gray[i];sum+=lap;squares+=lap*lap;++count;}
  result->brightness=brightness/gray.size()/255.0;result->sharpness=std::max(0.0,squares/count-std::pow(sum/count,2));return 0;
 }catch(...){return 2;}
}
